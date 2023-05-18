/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import moment from 'moment';
import sagus from 'sagus';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { DatabaseService, type User, UserActivityType, type UserSession, UserVariant } from '@app/providers/database';
import { MailService, MailType } from '@app/providers/mail';
import { AppError, ErrorCode } from '@app/shared/errors';
import { AuthService } from '@app/shared/modules';
import { type Projection } from '@app/shared/utils';

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

  constructor(
    private readonly authService: AuthService,
    private readonly contextService: ContextService,
    private readonly mailService: MailService,
    databaseService: DatabaseService,
  ) {
    this.nativeUserModel = databaseService.getUserModel(UserVariant.NATIVE);
    this.userModel = databaseService.getUserModel();
  }

  getUser(projection: Projection<User>) {
    const { _id } = this.contextService.getCurrentUser(true);
    if (projection.sessions) projection.sessions.id = 1;
    return this.userModel.findOne({ _id }, projection).lean() as Promise<User>;
  }

  convertSession(userSession: UserSession) {
    const session: Session = { ...userSession };
    const currentSession = this.contextService.getCurrentSession(true);
    if (currentSession.id === userSession.id) session.currentSession = true;
    return session;
  }

  async loginUser(email: string, password: string) {
    const user = await this.nativeUserModel.findOne({ email }).lean();
    if (!user) throw new AppError(ErrorCode.IAM001);
    const isValidPassword = await sagus.compareHash(password, user.password);
    if (!isValidPassword) throw new AppError(ErrorCode.IAM006);
    const session = await this.authService.initUserSession(user);
    this.contextService.setCurrentUser(user);
    this.contextService.setCurrentSession(session);
    return user;
  }

  registerUser(email: string, password: string, name: string) {
    return this.authService.createUser({ email, password, name, createSession: true });
  }

  getCSRFToken() {
    const expireAt = moment().add(1, 'hour');
    return this.authService.generateCSRFToken(expireAt);
  }

  async verifyEmailAddress(code: string) {
    const [encodedEmail, emailVerificationCode] = code.split('|');
    if (!encodedEmail || !emailVerificationCode) throw new AppError(ErrorCode.IAM011);
    const email = Buffer.from(encodedEmail, 'base64').toString();
    const user = await this.nativeUserModel.findOne({ email }).lean();
    if (!user) throw new AppError(ErrorCode.IAM011);
    if (!user.emailVerificationCode) throw new AppError(ErrorCode.IAM012);
    if (user.emailVerificationCode != emailVerificationCode) throw new AppError(ErrorCode.IAM011);
    this.nativeUserModel.updateOne({ email }, { $unset: { emailVerificationCode: '' } });
  }

  async resendEmailVerificationMail() {
    const user = await this.getUser({ email: 1, emailVerificationCode: 1, name: 1 });
    if (!user.emailVerificationCode) throw new AppError(ErrorCode.IAM012);
    const code = Buffer.from(user.email).toString('base64') + '|' + user.emailVerificationCode;
    this.mailService.sendMail(MailType.EMAIL_VERIFICATION, user.email, { code, name: user.name });
  }

  async forgotPassword(email: string) {
    const user = await this.nativeUserModel.findOne({ email }, 'email name').lean();
    if (!user) return;
    const expiry = moment().add(1, 'day').format('X');
    const passwordResetCode = expiry + '.' + sagus.genRandom(16);
    await this.nativeUserModel.updateOne({ _id: user._id }, { $set: { passwordResetCode } });
    const code = Buffer.from(user.email).toString('base64url') + '|' + passwordResetCode;
    this.mailService.sendMail(MailType.RESET_PASSWORD, user.email, { code, name: user.name });
  }

  async resetPassword(code: string, newPassword: string) {
    const [encodedEmail, passwordResetCode] = code.split('|');
    if (!encodedEmail || !passwordResetCode) throw new AppError(ErrorCode.IAM010);

    const email = Buffer.from(encodedEmail, 'base64url').toString();
    const user = await this.nativeUserModel.findOne({ email, passwordResetCode }, 'passwordResetCode').lean();
    if (!user || !user.passwordResetCode) throw new AppError(ErrorCode.IAM010);

    const [expiry] = user.passwordResetCode.split('.') as [string, string];
    if (moment().isAfter(expiry)) {
      await this.nativeUserModel.updateOne({ _id: user._id }, { $unset: { passwordResetCode: '' } });
      return 'Password reset code is expired';
    }
    await this.nativeUserModel.updateOne({ _id: user._id }, { $set: { password: newPassword }, $unset: { passwordResetCode: '' } });
    return 'Password reset successfully';
  }

  async updatePassword(oldPassword: string, newPassword: string) {
    const { _id } = this.contextService.getCurrentUser(true);
    const user = await this.nativeUserModel.findOne({ _id }, 'email password');
    if (!user) throw new AppError(ErrorCode.IAM007);
    const isValid = await sagus.compareHash(oldPassword, user.password);
    if (!isValid) throw new AppError(ErrorCode.IAM008);
    const activity = { type: UserActivityType.CHANGE_PASSWORD };
    const result = await this.nativeUserModel.updateOne({ email: user.email }, { $set: { password: newPassword }, $push: { activities: activity } });
    return result.modifiedCount === 1;
  }

  logoutUser(sessionId?: number) {
    const user = this.contextService.getCurrentUser(true);
    const session = this.contextService.getCurrentSession(true);
    return this.authService.removeSession(user._id, sessionId ?? session.id);
  }

  async updateUser(update: UpdateUserArgs) {
    const user = this.contextService.getCurrentUser(true);
    return this.userModel.findOneAndUpdate({ _id: user._id }, { $set: update }).lean();
  }
}
