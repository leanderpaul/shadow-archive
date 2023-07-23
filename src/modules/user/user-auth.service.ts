/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { default as moment } from 'moment';
import { type Types } from 'mongoose';
import { default as sagus } from 'sagus';
import { default as useragent } from 'useragent';

/**
 * Importing user defined packages
 */
import { DatabaseService, type NativeUser, type User, type UserSession, UserVariant } from '@app/modules/database';
import { MailService, MailType } from '@app/providers/mail';
import { UserActivityType } from '@app/shared/constants';
import { AppError, ErrorCode, NeverError } from '@app/shared/errors';
import { Config, Context } from '@app/shared/services';

import { CookieService } from './cookie.service';
import { UserService } from './user.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Injectable()
export class UserAuthService {
  private readonly userModel;
  private readonly nativeUserModel;

  constructor(
    databaseService: DatabaseService,
    private readonly userService: UserService,
    private readonly cookieService: CookieService,
    private readonly mailService: MailService,
  ) {
    this.userModel = databaseService.getUserModel();
    this.nativeUserModel = databaseService.getUserModel(UserVariant.NATIVE);
  }

  private generateUserSession(user?: Pick<User, 'sessions'>): UserSession {
    const prevId = user?.sessions[user.sessions.length - 1]?.id || 0;
    const session: UserSession = { id: prevId + 1, token: sagus.genRandom(32, 'base64'), accessedAt: new Date() };
    const req = Context.getCurrentRequest();
    const agent = useragent.parse(req.headers['user-agent']);
    if (agent.family != 'Other') session.browser = agent.family;
    if (agent.os.family != 'Other') session.os = agent.os.family;
    if (agent.device.family != 'Other') session.device = agent.device.family;
    if (!session.device && session.os) session.device = ['Windows', 'Linux', 'Mac'].includes(session.os) ? 'Computer' : 'Mobile';
    return session;
  }

  async registerNativeUser(name: string, email: string, password: string): Promise<NativeUser> {
    const session = this.generateUserSession();
    const user = await this.userService.createUser({ email, name, password }, session);

    Context.setCurrentUser(user);
    Context.setCurrentSession(session);
    this.cookieService.setUserCookies(user.uid, session.token);
    return user;
  }

  async loginUser(email: string, password: string): Promise<Pick<NativeUser, 'uid' | 'type' | 'email' | 'name' | 'password' | 'verified' | 'sessions'>> {
    const roleProjection = { iam: { role: 1 }, fiction: { role: 1 }, chronicle: { role: 1 }, archive: { role: 1 } } as const;
    const user = await this.userService.getNativeUser(email, { email: 1, name: 1, password: 1, verified: 1, sessions: 1, ...roleProjection });
    if (!user) throw new AppError(ErrorCode.IAM001);
    const isValidPassword = await sagus.compareHash(password, user.password);
    if (!isValidPassword) throw new AppError(ErrorCode.IAM006);

    const session = this.generateUserSession(user);
    const maxAge = Config.get('cookie.max-age');
    const expireAt = moment().subtract(maxAge, 'seconds').toDate();
    const validSessions = user.sessions.filter(s => s.accessedAt > expireAt);
    await this.userModel.updateOne({ uid: user.uid }, { $set: { sessions: [...validSessions, session] } });

    Context.setCurrentUser(user);
    Context.setCurrentSession(session);
    this.cookieService.setUserCookies(user.uid, session.token);
    return user;
  }

  async sendEmailVerificationMail(): Promise<void> {
    const { verified, uid } = Context.getCurrentUser(true);
    if (verified) throw new AppError(ErrorCode.IAM012);
    const user = await this.userService.getNativeUser(uid, ['email', 'name', 'emailVerificationCode']);
    if (!user) throw new NeverError('user not found');
    if (!user.emailVerificationCode) throw new AppError(ErrorCode.IAM012);
    const code = Buffer.from(user.email).toString('base64') + '|' + user.emailVerificationCode;
    this.mailService.sendMail(MailType.EMAIL_VERIFICATION, user.email, { code, name: user.name });
  }

  async sendResetPasswordMail(email: string): Promise<void> {
    const user = await this.userService.getNativeUser(email, ['email', 'name']);
    if (!user) return;
    const expiry = moment().add(1, 'day').format('X');
    const passwordResetCode = expiry + '.' + sagus.genRandom(16);
    await this.nativeUserModel.updateOne({ uid: user.uid }, { $set: { passwordResetCode } });
    const code = Buffer.from(user.email).toString('base64url') + '|' + passwordResetCode;
    this.mailService.sendMail(MailType.RESET_PASSWORD, user.email, { code, name: user.name });
  }

  async resetPassword(code: string, newPassword: string): Promise<boolean> {
    const [encodedEmail, passwordResetCode] = code.split('|');
    if (!encodedEmail || !passwordResetCode) throw new AppError(ErrorCode.IAM010);

    const email = Buffer.from(encodedEmail, 'base64url').toString();
    const user = await this.userService.getNativeUser(email, ['passwordResetCode']);
    if (user?.passwordResetCode !== passwordResetCode) throw new AppError(ErrorCode.IAM010);

    const [expiry] = user.passwordResetCode.split('.') as [string, string];
    if (moment(expiry, 'X').isBefore()) throw new AppError(ErrorCode.IAM010);
    if (!newPassword) return false;

    const activity = { type: UserActivityType.RESET_PASSWORD };
    await this.nativeUserModel.updateOne({ uid: user.uid }, { $push: { activities: activity }, $set: { password: newPassword }, $unset: { passwordResetCode: '' } });
    return true;
  }

  async logout(uid: Types.ObjectId, sessionId: number): Promise<void> {
    const updateSession = sessionId === -1 ? { $set: { sessions: [] } } : { $pull: { sessions: { id: sessionId } } };
    await this.userModel.updateOne({ _id: uid }, updateSession);
    const currentSession = Context.getCurrentSession(true);
    if (sessionId === -1 || currentSession.id === sessionId) this.cookieService.clearCookies();
  }
}
