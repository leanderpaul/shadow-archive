/**
 * Importing npm packages
 */
import sagus from 'sagus';
import moment from 'moment';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { NativeUser, ContextService, MailService, MailType } from '@app/providers';
import { AppError, ErrorCode } from '@app/shared/errors';
import { AuthService } from '@app/shared/modules';

/**
 * Importing and defining types
 */
import type { NativeUserModel } from '@app/providers';

/**
 * Declaring the constants
 */

@Injectable()
export class AccountsService {
  constructor(
    private readonly authService: AuthService,
    private readonly contextService: ContextService,
    private readonly mailService: MailService,
    @InjectModel(NativeUser.name) private readonly nativeUserModel: NativeUserModel,
  ) {}

  getUser() {
    return this.contextService.getCurrentUser(true);
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
    if (!user) throw new AppError(ErrorCode.IAM010);

    const [expiry] = user.passwordResetCode!.split('.') as [string, string];
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

  logoutUser(clearAllSessions: boolean) {
    const user = this.getUser();
    const session = this.contextService.getCurrentSession(true);
    return this.authService.removeSession(user, clearAllSessions ? '*' : session.id);
  }

  getCSRFToken() {
    const session = this.contextService.getCurrentSession(true);
    return this.authService.generateCSRFToken(session.id);
  }
}
