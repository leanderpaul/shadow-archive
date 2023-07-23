/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { default as sagus } from 'sagus';

/**
 * Importing user defined packages
 */
import { DatabaseService, type ID, type NativeUser, type OAuthUser, type User, type UserSession, UserVariant } from '@app/modules/database';
import { MailService, MailType } from '@app/providers/mail';
import { UserActivityType } from '@app/shared/constants';
import { AppError, ErrorCode, NeverError } from '@app/shared/errors';
import { type Projection } from '@app/shared/interfaces';
import { Context } from '@app/shared/services';

/**
 * Defining types
 */

export type UserInfo = Pick<User, 'email' | 'name' | 'sessions' | 'uid' | 'verified' | 'type'>;

export type CreateNativeUser = Pick<NativeUser, 'email' | 'name' | 'password'> & { verified?: boolean };

export type CreateOAuthUser = Pick<OAuthUser, 'email' | 'name' | 'spuid' | 'refreshToken'> & { verified?: boolean };

export type CreateUserSession = Pick<UserSession, 'id' | 'browser' | 'device' | 'os'>;

/**
 * Declaring the constants
 */
const defaultUserProjection: Projection<User> = { email: 1, name: 1, sessions: 1, verified: 1 };

@Injectable()
export class UserService {
  private readonly userModel;
  private readonly oauthUserModel;
  private readonly nativeUserModel;

  constructor(databaseService: DatabaseService, private readonly mailService: MailService) {
    this.userModel = databaseService.getUserModel();
    this.oauthUserModel = databaseService.getUserModel(UserVariant.OAUTH);
    this.nativeUserModel = databaseService.getUserModel(UserVariant.NATIVE);
  }

  async getTotalUserCount(): Promise<number> {
    return await this.userModel.estimatedDocumentCount();
  }

  async getNativeUser(uidOrEmail: ID): Promise<UserInfo | null>;
  async getNativeUser<T extends keyof Omit<NativeUser, 'uid' | 'type'>>(uidOrEmail: ID, projection: T[]): Promise<Pick<NativeUser, 'uid' | 'type' | T> | null>;
  async getNativeUser(uidOrEmail: ID, projection: Projection<NativeUser>): Promise<NativeUser | null>;
  async getNativeUser<T>(uidOrEmail: ID, projection?: Projection<NativeUser> | T[]): Promise<NativeUser | null> {
    const query = typeof uidOrEmail === 'string' && uidOrEmail.includes('@') ? { email: uidOrEmail } : { uid: uidOrEmail };
    if (!projection) projection = defaultUserProjection;
    return await this.nativeUserModel.findOne(query, projection).select('type').lean();
  }

  async getOAuthUser(uidOrEmail: ID): Promise<UserInfo | null>;
  async getOAuthUser<T extends keyof Omit<OAuthUser, 'uid' | 'type'>>(uidOrEmail: ID, projection: T[]): Promise<Pick<OAuthUser, 'uid' | 'type' | T> | null>;
  async getOAuthUser(uidOrEmail: ID, projection: Projection<OAuthUser>): Promise<OAuthUser | null>;
  async getOAuthUser<T>(uidOrEmail: ID, projection?: Projection<OAuthUser> | T[]): Promise<OAuthUser | null> {
    const query = typeof uidOrEmail === 'string' && uidOrEmail.includes('@') ? { email: uidOrEmail } : { uid: uidOrEmail };
    if (!projection) projection = defaultUserProjection;
    return await this.oauthUserModel.findOne(query, projection).select('type').lean();
  }

  async getUser(uidOrEmail: ID): Promise<UserInfo | null>;
  async getUser<T extends keyof Omit<User, 'uid' | 'type'>>(uidOrEmail: ID, projection: T[]): Promise<Pick<User, 'uid' | 'type' | T> | null>;
  async getUser(uidOrEmail: ID, projection: Projection<User>): Promise<User | null>;
  async getUser<T>(uidOrEmail: ID, projection?: T[] | Projection<User>): Promise<User | null> {
    const query = typeof uidOrEmail === 'string' && uidOrEmail.includes('@') ? { email: uidOrEmail } : { uid: uidOrEmail };
    if (!projection) projection = defaultUserProjection;
    return await this.userModel.findOne(query, projection).select('type').lean();
  }

  async createUser(newUser: CreateNativeUser, session?: CreateUserSession): Promise<NativeUser>;
  async createUser(newUser: CreateOAuthUser, session?: CreateUserSession): Promise<OAuthUser>;
  async createUser(newUser: CreateNativeUser | CreateOAuthUser, session?: CreateUserSession): Promise<NativeUser | OAuthUser> {
    const userData = { ...newUser, sessions: session ? [session] : [] };
    const user = await ('password' in newUser ? this.nativeUserModel.create(userData) : this.oauthUserModel.create(userData));
    if (user.emailVerificationCode) {
      const code = Buffer.from(user.email).toString('base64') + '|' + user.emailVerificationCode;
      this.mailService.sendMail(MailType.EMAIL_VERIFICATION, user.email, { code, name: user.name });
    }
    return user;
  }

  async verifyUserEmail(codeOrEmail: string): Promise<void> {
    if (codeOrEmail.includes('@')) {
      const user = await this.userModel.findOneAndUpdate({ email: codeOrEmail }, { $set: { verified: true } }, { new: false });
      if (!user) throw new AppError(ErrorCode.IAM011);
      if (user.verified) throw new AppError(ErrorCode.IAM012);
      return;
    }

    const [encodedEmail, emailVerificationCode] = codeOrEmail.split('|');
    if (!encodedEmail || !emailVerificationCode) throw new AppError(ErrorCode.IAM011);
    const email = Buffer.from(encodedEmail, 'base64').toString();
    const user = await this.nativeUserModel.findOne({ email }).lean();
    if (!user) throw new AppError(ErrorCode.IAM011);
    if (!user.emailVerificationCode) throw new AppError(ErrorCode.IAM012);
    if (user.emailVerificationCode != emailVerificationCode) throw new AppError(ErrorCode.IAM011);
    await this.nativeUserModel.updateOne({ uid: user.uid }, { $set: { verified: true }, $unset: { emailVerificationCode: '' } });
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const { uid } = Context.getCurrentUser(true);
    const user = await this.nativeUserModel.findOne({ uid }, 'email password');
    if (!user) throw new AppError(ErrorCode.IAM007);
    const isValid = await sagus.compareHash(oldPassword, user.password);
    if (!isValid) throw new AppError(ErrorCode.IAM008);
    const activity = { type: UserActivityType.CHANGE_PASSWORD };
    await this.nativeUserModel.updateOne({ uid }, { $set: { password: newPassword }, $push: { activities: activity } });
  }

  async updateUser(uidOrEmail: ID, update: Partial<Pick<User, 'name' | 'imageUrl' | 'chronicle'>>): Promise<User> {
    const query = typeof uidOrEmail === 'string' ? { email: uidOrEmail } : { uid: uidOrEmail };
    const updatedUser = await this.userModel.findOneAndUpdate(query, { $set: update }).lean();
    if (!updatedUser) throw new NeverError('User not present after updated');
    return updatedUser;
  }
}
