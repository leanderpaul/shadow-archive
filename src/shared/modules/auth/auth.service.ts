/**
 * Importing npm packages
 */
import crypto from 'crypto';
import moment from 'moment';
import sagus from 'sagus';
import useragent from 'useragent';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */
import { ConfigRecord } from '@app/config';
import { ContextService } from '@app/providers/context';
import { DBUtils, DatabaseService, UserVariant, User, UserSession } from '@app/providers/database';
import { MailService, MailType } from '@app/providers/mail';
import { AppError, ErrorCode } from '@app/shared/errors';

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

/**
 * Declaring the constants
 */
const COOKIE_SESSION_INITED = 'COOKIE_SESSION_INITED';

@Injectable()
export class AuthService {
  private readonly userModel;
  private readonly nativeUserModel;

  constructor(
    private readonly configService: ConfigService<ConfigRecord>,
    private readonly contextService: ContextService,
    private readonly mailService: MailService,
    databaseService: DatabaseService,
  ) {
    this.userModel = databaseService.getUserModel();
    this.nativeUserModel = databaseService.getUserModel(UserVariant.NATIVE);
  }

  private encrypt(iv: string | Buffer, secretKey: Buffer, input: string, encoding: BufferEncoding = 'base64') {
    const biv = typeof iv === 'string' ? Buffer.from(iv, 'base64') : iv;
    const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, biv);
    const result = Buffer.concat([cipher.update(input), cipher.final()]);
    return result.toString(encoding);
  }

  private decrypt(iv: string | Buffer, secretKey: Buffer, encryptedinput: string, encoding: BufferEncoding = 'base64') {
    const biv = typeof iv === 'string' ? Buffer.from(iv, 'base64') : iv;
    const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, biv);
    const result = Buffer.concat([decipher.update(Buffer.from(encryptedinput, encoding)), decipher.final()]);
    return result.toString();
  }

  private encodeCookie(uid: string, sid: string) {
    return uid + '|' + sid;
  }

  private decodeCookie(cookie: string) {
    const data = cookie.split('|') as [string, string];
    return { uid: data[0], sid: data[1] };
  }

  private clearCookies(res?: FastifyReply) {
    const cookieName = this.configService.get('COOKIE_NAME');
    if (!res?.clearCookie) res = this.contextService.getCurrentResponse();
    res.clearCookie(cookieName);
    return null;
  }

  private setCookies(uid: string, sid: string, res?: FastifyReply) {
    const name = this.configService.get('COOKIE_NAME');
    const maxAge = this.configService.get('COOKIE_MAX_AGE');
    const value = this.encodeCookie(uid, sid);
    const secure = this.configService.get('IS_PROD_SERVER');
    const domain = secure ? this.configService.get('DOMAIN') : undefined;
    if (!res?.setCookie) res = this.contextService.getCurrentResponse();
    res.setCookie(name, value, { maxAge, secure, domain, httpOnly: true, path: '/' });
  }

  generateCSRFToken(expireAt: moment.Moment) {
    const session = this.contextService.getCurrentSession(true);
    const md5 = crypto.createHash('md5');
    const payload = expireAt.unix() + '|' + session.id;
    return expireAt.unix() + '|' + md5.update(payload).digest('base64url');
  }

  async verifyCSRFToken() {
    const req = this.contextService.getCurrentRequest();
    const res = this.contextService.getCurrentResponse();

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

  private generateUserSession() {
    const session: UserSession = { id: sagus.genRandom(32, 'base64'), accessedAt: new Date() };
    const req = this.contextService.getCurrentRequest();
    const agent = useragent.parse(req.headers['user-agent']);
    if (agent.family != 'Other') session.browser = agent.toAgent();
    if (agent.os.family != 'Other') session.os = agent.os.toString();
    if (agent.device.family != 'Other') session.device = agent.device.toString();
    return session;
  }

  async getCurrentUserContext(req: FastifyRequest, res: FastifyReply) {
    const inited = this.contextService.get<true>(COOKIE_SESSION_INITED);

    /** Return current user if session and user are already set */
    if (inited) {
      const currentUser = this.contextService.getCurrentUser();
      const currentSession = this.contextService.getCurrentSession();
      return currentUser && currentSession ? { user: currentUser, session: currentSession } : null;
    } else this.contextService.set(COOKIE_SESSION_INITED, true);

    /** Parsing the cookie */
    const cookieName = this.configService.get('COOKIE_NAME');
    const cookie = req.cookies[cookieName] as string | undefined;
    if (!cookie) return null;
    const { uid, sid } = this.decodeCookie(cookie);

    /** Verifying the cookie */
    const _id = DBUtils.toObjectID(uid);
    if (!_id) return null;
    const user = await this.userModel.findOne({ _id }).lean();
    if (!user) return this.clearCookies(res);
    const session = user.sessions.find(s => s.id === sid);
    if (!session) return this.clearCookies(res);
    const maxAge = this.configService.get('COOKIE_MAX_AGE');
    const expireAt = moment().subtract(maxAge, 'seconds');
    const validSession = moment(session.accessedAt).isAfter(expireAt);
    if (!validSession) {
      this.clearCookies(res);
      this.userModel.updateOne({ _id }, { $pullAll: { 'sessions.accessedAt': { $lt: expireAt } } });
      throw new AppError(ErrorCode.IAM013);
    }

    /** Setting up the request context values */
    this.contextService.setCurrentUser(user);
    this.contextService.setCurrentSession(session);

    return { user, session };
  }

  async initUserSession(user: User) {
    const session = this.generateUserSession();
    const maxAge = this.configService.get('COOKIE_MAX_AGE');
    const expireAt = moment().subtract(maxAge, 'seconds').toDate();
    const validSessions = user.sessions.filter(s => s.accessedAt > expireAt);
    await this.userModel.updateOne({ _id: user._id }, { $set: { sessions: [...validSessions, session] } });
    this.setCookies(user.uid, session.id);
    this.contextService.setCurrentSession(session);
    return session;
  }

  async createUser(newUser: ICreateUser) {
    const { createSession = false, ...userObj } = newUser;
    const sessions = createSession ? [this.generateUserSession()] : [];
    const emailVerificationCode = sagus.genRandom(16);
    const user = await this.nativeUserModel.create({ ...userObj, sessions, emailVerificationCode });

    if (createSession && user.sessions[0]) {
      const session = user.sessions[0];
      this.setCookies(user.uid, session.id);
      this.contextService.setCurrentUser(user);
      this.contextService.setCurrentSession(session);
    }

    const code = Buffer.from(user.email).toString('base64') + '|' + emailVerificationCode;
    this.mailService.sendMail(MailType.EMAIL_VERIFICATION, user.email, { code, name: user.name });

    return user;
  }

  async removeSession(user: User, sessionId: string) {
    const updateSession = sessionId === '*' ? { $set: { sessions: [] } } : { $pull: { sessions: { id: sessionId } } };
    await this.userModel.updateOne({ _id: user._id }, updateSession);
    this.clearCookies();
  }
}
