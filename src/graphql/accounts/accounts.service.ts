/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import moment from 'moment';
import sagus from 'sagus';

/**
 * Importing user defined packages
 */
import { type Projection } from '@app/graphql/common';
import { AuthService } from '@app/modules/auth';
import { DatabaseService, type User, UserActivityType, type UserSession, UserVariant } from '@app/modules/database';
import { MailService, MailType } from '@app/providers/mail';
import { AppError, ErrorCode, NeverError } from '@app/shared/errors';
import { Context } from '@app/shared/services';

import { type UpdateUserArgs } from './accounts.dto';
import { type Session } from './accounts.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Injectable()
export class AccountsService {
  private readonly nativeUserModel;
  private readonly userModel;

  constructor(private readonly authService: AuthService, private readonly mailService: MailService, databaseService: DatabaseService) {
    this.nativeUserModel = databaseService.getUserModel(UserVariant.NATIVE);
    this.userModel = databaseService.getUserModel();
  }

  getUser(projection: Projection<User>): Promise<User> {
    const { _id } = Context.getCurrentUser(true);
    if (projection.sessions) projection.sessions.id = 1;
    return this.userModel.findOne({ _id }, projection).lean() as Promise<User>;
  }

  convertSession(userSession: UserSession): Session {
    const session: Session = { ...userSession };
    const currentSession = Context.getCurrentSession(true);
    if (currentSession.id === userSession.id) session.currentSession = true;
    return session;
  }

  async loginUser(email: string, password: string): Promise<User> {
    const user = await this.nativeUserModel.findOne({ email }).lean();
    if (!user) throw new AppError(ErrorCode.IAM001);
    const isValidPassword = await sagus.compareHash(password, user.password);
    if (!isValidPassword) throw new AppError(ErrorCode.IAM006);
    const session = await this.authService.initUserSession(user);
    Context.setCurrentUser(user);
    Context.setCurrentSession(session);
    return user;
  }

  registerUser(email: string, password: string, name: string): Promise<User> {
    return this.authService.createUser({ email, password, name, createSession: true });
  }

  getCSRFToken(): string {
    const expireAt = moment().add(1, 'hour');
    return this.authService.generateCSRFToken(expireAt);
  }

  async verifyEmailAddress(code: string): Promise<void> {
    const [encodedEmail, emailVerificationCode] = code.split('|');
    if (!encodedEmail || !emailVerificationCode) throw new AppError(ErrorCode.IAM011);
    const email = Buffer.from(encodedEmail, 'base64').toString();
    const user = await this.nativeUserModel.findOne({ email }).lean();
    if (!user) throw new AppError(ErrorCode.IAM011);
    if (!user.emailVerificationCode) throw new AppError(ErrorCode.IAM012);
    if (user.emailVerificationCode != emailVerificationCode) throw new AppError(ErrorCode.IAM011);
    this.nativeUserModel.updateOne({ email }, { $unset: { emailVerificationCode: '' } });
  }

  async resendEmailVerificationMail(): Promise<void> {
    const user = await this.getUser({ email: 1, emailVerificationCode: 1, name: 1 });
    if (!user.emailVerificationCode) throw new AppError(ErrorCode.IAM012);
    const code = Buffer.from(user.email).toString('base64') + '|' + user.emailVerificationCode;
    this.mailService.sendMail(MailType.EMAIL_VERIFICATION, user.email, { code, name: user.name });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.nativeUserModel.findOne({ email }, 'email name').lean();
    if (!user) return;
    const expiry = moment().add(1, 'day').format('X');
    const passwordResetCode = expiry + '.' + sagus.genRandom(16);
    await this.nativeUserModel.updateOne({ _id: user._id }, { $set: { passwordResetCode } });
    const code = Buffer.from(user.email).toString('base64url') + '|' + passwordResetCode;
    this.mailService.sendMail(MailType.RESET_PASSWORD, user.email, { code, name: user.name });
  }

  async resetPassword(code: string, newPassword: string): Promise<boolean> {
    const [encodedEmail, passwordResetCode] = code.split('|');
    if (!encodedEmail || !passwordResetCode) throw new AppError(ErrorCode.IAM010);

    const email = Buffer.from(encodedEmail, 'base64url').toString();
    const user = await this.nativeUserModel.findOne({ email, passwordResetCode }, 'passwordResetCode').lean();
    if (!user || !user.passwordResetCode) throw new AppError(ErrorCode.IAM010);

    const [expiry] = user.passwordResetCode.split('.') as [string, string];
    if (moment().isAfter(expiry)) throw new AppError(ErrorCode.IAM010);
    if (!newPassword) return false;

    const activity = { type: UserActivityType.RESET_PASSWORD };
    await this.nativeUserModel.updateOne({ _id: user._id }, { $push: { activities: activity }, $set: { password: newPassword }, $unset: { passwordResetCode: '' } });
    return true;
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const { _id } = Context.getCurrentUser(true);
    const user = await this.nativeUserModel.findOne({ _id }, 'email password');
    if (!user) throw new AppError(ErrorCode.IAM007);
    const isValid = await sagus.compareHash(oldPassword, user.password);
    if (!isValid) throw new AppError(ErrorCode.IAM008);
    const activity = { type: UserActivityType.CHANGE_PASSWORD };
    const result = await this.nativeUserModel.updateOne({ email: user.email }, { $set: { password: newPassword }, $push: { activities: activity } });
    return result.modifiedCount === 1;
  }

  logoutUser(sessionId?: number): Promise<void> {
    const user = Context.getCurrentUser(true);
    const session = Context.getCurrentSession(true);
    return this.authService.removeSession(user._id, sessionId ?? session.id);
  }

  async updateUser(update: UpdateUserArgs): Promise<User> {
    const user = Context.getCurrentUser(true);
    const updatedUser = await this.userModel.findOneAndUpdate({ _id: user._id }, { $set: update }).lean();
    if (!updatedUser) throw new NeverError('User not present after updated');
    return updatedUser;
  }
}
