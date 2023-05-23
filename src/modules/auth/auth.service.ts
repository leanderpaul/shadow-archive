/**
 * Importing npm packages
 */
import crypto from 'crypto';

import { Injectable } from '@nestjs/common';
import { type FastifyReply, type FastifyRequest } from 'fastify';
import moment from 'moment';
import { type ObjectId } from 'mongodb';
import sagus from 'sagus';
import { parse } from 'useragent';

/**
 * Importing user defined packages
 */
import { DBUtils, DatabaseService, type User, type UserSession, UserVariant } from '@app/modules/database';
import { MailService, MailType } from '@app/providers/mail';
import { AppError, ErrorCode } from '@app/shared/errors';
import { Config, Context, type CurrentUser } from '@app/shared/services';

/**
 * Defining types
 */

export interface ICreateUser {
  name: string;
  email: string;
  password: string;
  createSession?: boolean;
  verified?: boolean;
}

interface UserContext {
  user: CurrentUser;
  session: UserSession;
}

/**
 * Declaring the constants
 */
const COOKIE_SESSION_INITED = 'COOKIE_SESSION_INITED';

@Injectable()
export class AuthService {
  private readonly userModel;
  private readonly nativeUserModel;

  constructor(private readonly mailService: MailService, databaseService: DatabaseService) {
    this.userModel = databaseService.getUserModel();
    this.nativeUserModel = databaseService.getUserModel(UserVariant.NATIVE);
  }

  private encrypt(iv: string | Buffer, secretKey: Buffer, input: string, encoding: BufferEncoding = 'base64'): string {
    const biv = typeof iv === 'string' ? Buffer.from(iv, 'base64') : iv;
    const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, biv);
    const result = Buffer.concat([cipher.update(input), cipher.final()]);
    return result.toString(encoding);
  }

  private decrypt(iv: string | Buffer, secretKey: Buffer, encryptedinput: string, encoding: BufferEncoding = 'base64'): string {
    const biv = typeof iv === 'string' ? Buffer.from(iv, 'base64') : iv;
    const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, biv);
    const result = Buffer.concat([decipher.update(Buffer.from(encryptedinput, encoding)), decipher.final()]);
    return result.toString();
  }

  private encodeCookie(uid: string, token: string): string {
    return uid + '|' + token;
  }

  private decodeCookie(cookie: string): { uid: string; token: string } {
    const data = cookie.split('|') as [string, string];
    return { uid: data[0], token: data[1] };
  }

  private clearCookies(res?: FastifyReply): null {
    const cookieName = Config.get('cookie.name');
    if (!res?.clearCookie) res = Context.getCurrentResponse();
    const secure = Config.get('app.env') === 'production';
    const domain = secure ? Config.get('app.domain') : undefined;
    res.clearCookie(cookieName, { domain });
    return null;
  }

  private setCookies(uid: string, token: string, res?: FastifyReply): void {
    const name = Config.get('cookie.name');
    const maxAge = Config.get('cookie.max-age');
    const value = this.encodeCookie(uid, token);
    const secure = Config.get('app.env') === 'production';
    const domain = secure ? Config.get('app.domain') : undefined;
    if (!res?.setCookie) res = Context.getCurrentResponse();
    res.setCookie(name, value, { maxAge, secure, domain, httpOnly: true, path: '/' });
  }

  generateCSRFToken(expireAt: moment.Moment): string {
    const session = Context.getCurrentSession(true);
    const md5 = crypto.createHash('md5');
    const payload = expireAt.unix() + '|' + session.token;
    return expireAt.unix() + '|' + md5.update(payload).digest('base64url');
  }

  async verifyCSRFToken(): Promise<true> {
    const req = Context.getCurrentRequest();
    const res = Context.getCurrentResponse();

    const token = req.headers['x-csrf-token'] as string | undefined;
    if (!token) throw new AppError(ErrorCode.IAM005);
    const auth = await this.getCurrentUserContext(req, res);
    if (!auth) throw new AppError(ErrorCode.IAM004);

    const [expireAt] = token.split('|');
    const expiryDate = moment(expireAt, 'X');
    if (expiryDate.isBefore()) throw new AppError(ErrorCode.IAM005);
    const csrfToken = this.generateCSRFToken(expiryDate);
    if (token != csrfToken) throw new AppError(ErrorCode.IAM005);

    return true;
  }

  private generateUserSession(user?: User): UserSession {
    const prevId = user?.sessions[user.sessions.length - 1]?.id || 0;
    const session: UserSession = { id: prevId + 1, token: sagus.genRandom(32, 'base64'), accessedAt: new Date() };
    const req = Context.getCurrentRequest();
    const agent = parse(req.headers['user-agent']);
    if (agent.family != 'Other') session.browser = agent.family;
    if (agent.os.family != 'Other') session.os = agent.os.family;
    if (agent.device.family != 'Other') session.device = agent.device.family;
    if (!session.device && session.os) session.device = ['Windows', 'Linux', 'Mac'].includes(session.os) ? 'Computer' : 'Mobile';
    return session;
  }

  async getCurrentUserContext(req: FastifyRequest, res: FastifyReply): Promise<UserContext | null> {
    const inited = Context.get<true>(COOKIE_SESSION_INITED);

    /** Return current user if session and user are already set */
    if (inited) {
      const currentUser = Context.getCurrentUser();
      const currentSession = Context.getCurrentSession();
      return currentUser && currentSession ? { user: currentUser, session: currentSession } : null;
    } else Context.set(COOKIE_SESSION_INITED, true);

    /** Parsing the cookie */
    const cookieName = Config.get('cookie.name');
    const maxAge = Config.get('cookie.max-age');
    const cookie = req.cookies[cookieName] as string | undefined;
    if (!cookie) return null;
    const { uid, token } = this.decodeCookie(cookie);

    /** Verifying the cookie */
    const _id = DBUtils.toObjectID(uid);
    if (!_id) return null;
    const promise = this.userModel.findOne({ _id });
    promise.setUpdate({ $pull: { sessions: { accessedAt: { $lt: moment().subtract(maxAge, 'seconds').toDate() } } } });
    promise.projection('uid email admin verified sessions');
    promise.setOptions({ runValidators: false });
    const user = await promise.lean();
    if (!user) return this.clearCookies(res);
    const session = user.sessions.find(s => s.token === token);
    if (!session) return this.clearCookies(res);

    /** Updating the last accessed time in user seesion */
    this.userModel.updateOne({ _id, 'sessions.id': session.id }, { $set: { 'sessions.$.accessedAt': new Date() } }).then();

    /** Setting up the request context values */
    Context.setCurrentUser(user);
    Context.setCurrentSession(session);

    return { user, session };
  }

  async initUserSession(user: User): Promise<UserSession> {
    const session = this.generateUserSession(user);
    const maxAge = Config.get('cookie.max-age');
    const expireAt = moment().subtract(maxAge, 'seconds').toDate();
    const validSessions = user.sessions.filter(s => s.accessedAt > expireAt);
    await this.userModel.updateOne({ _id: user._id }, { $set: { sessions: [...validSessions, session] } });
    this.setCookies(user.uid, session.token);
    Context.setCurrentSession(session);
    return session;
  }

  async createUser(newUser: ICreateUser): Promise<User> {
    const { createSession = false, ...userObj } = newUser;
    const sessions = createSession ? [this.generateUserSession()] : [];
    const emailVerificationCode = sagus.genRandom(16);
    const user = await this.nativeUserModel.create({ ...userObj, sessions, emailVerificationCode });

    if (createSession && user.sessions[0]) {
      const session = user.sessions[0];
      this.setCookies(user.uid, session.token);
      Context.setCurrentUser(user);
      Context.setCurrentSession(session);
    }

    const code = Buffer.from(user.email).toString('base64') + '|' + emailVerificationCode;
    this.mailService.sendMail(MailType.EMAIL_VERIFICATION, user.email, { code, name: user.name });

    return user;
  }

  async removeSession(uid: ObjectId, sessionId: number): Promise<void> {
    const updateSession = sessionId === -1 ? { $set: { sessions: [] } } : { $pull: { sessions: { id: sessionId } } };
    await this.userModel.updateOne({ _id: uid }, updateSession);
    const currentSession = Context.getCurrentSession(true);
    if (sessionId === -1 || currentSession.id === sessionId) this.clearCookies();
  }
}
