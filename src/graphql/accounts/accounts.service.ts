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
import { DatabaseService, type UserSession, UserVariant } from '@app/providers/database';
import { MailService, MailType } from '@app/providers/mail';
import { AppError, ErrorCode } from '@app/shared/errors';
import { AuthService } from '@app/shared/modules';
import { Utils } from '@app/shared/utils';

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

  getUser() {
    return this.contextService.getCurrentUser(true);
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

  resendEmailVerificationMail() {
    const user = this.getUser();
    if (!user.emailVerificationCode) throw new AppError(ErrorCode.IAM012);
    const code = Buffer.from(user.email).toString('base64') + '|' + user.emailVerificationCode;
    this.mailService.sendMail(MailType.EMAIL_VERIFICATION, user.email, { code, name: user.name });
  }

  async forgotPassword(email: string) {
    const user = await this.nativeUserModel.findOne({ email }).lean();
    if (!user) return;
    const expiry = moment().add(1, 'day').format('X');
    const passwordResetCode = expiry + '.' + sagus.genRandom(16);
    await this.nativeUserModel.updateOne({ email }, { $set: { passwordResetCode } });
    const code = Buffer.from(user.email).toString('base64url') + '|' + passwordResetCode;
    this.mailService.sendMail(MailType.RESET_PASSWORD, user.email, { code, name: user.name });
  }

  async resetPassword(code: string, newPassword: string) {
    const [encodedEmail, passwordResetCode] = code.split('|');
    if (!encodedEmail || !passwordResetCode) throw new AppError(ErrorCode.IAM010);

    const email = Buffer.from(encodedEmail, 'base64url').toString();
    const user = await this.nativeUserModel.findOneAndUpdate({ email, passwordResetCode }).lean();
    if (!user || !user.passwordResetCode) throw new AppError(ErrorCode.IAM010);

    const [expiry] = user.passwordResetCode.split('.') as [string, string];
    if (moment().isAfter(expiry)) {
      await this.nativeUserModel.updateOne({ email }, { $unset: { passwordResetCode: '' } });
      return 'Password reset code is expired';
    }
    await this.nativeUserModel.updateOne({ email }, { $set: { password: newPassword }, $unset: { passwordResetCode: '' } });
    return 'Password reset successfully';
  }

  async updatePassword(oldPassword: string, newPassword: string) {
    const user = this.getUser();
    if (!this.nativeUserModel.isNativeUser(user)) throw new AppError(ErrorCode.IAM007);
    const isValid = await sagus.compareHash(oldPassword, user.password);
    if (!isValid) throw new AppError(ErrorCode.IAM008);
    const result = await this.nativeUserModel.updateOne({ email: user.email }, { $set: { password: newPassword } });
    return result.modifiedCount === 1;
  }

  logoutUser(sessionId?: number) {
    const user = this.getUser();
    const session = this.contextService.getCurrentSession(true);
    return this.authService.removeSession(user, sessionId ?? session.id);
  }

  async updateUser(update: UpdateUserArgs) {
    const user = this.getUser();
    if (!Utils.isChanged(user, update)) return user;
    return this.userModel.findOneAndUpdate({ _id: user._id }, { $set: update }).lean();
  }
}
