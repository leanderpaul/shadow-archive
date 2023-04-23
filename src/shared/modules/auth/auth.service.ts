/**
 * Importing npm packages
 */
import crypto from 'crypto';
import moment from 'moment';
import sagus from 'sagus';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */
import { ConfigRecord } from '@app/config';
import { ContextService } from '@app/providers/context';
import { DBUtils, DatabaseService, UserVariant, User } from '@app/providers/database';
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
const DEFAULT_SESSION_ID = 'unauthenticated';
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
    const maxAge = this.configService.get('COOKIE_MAX_AGE') * 1000;
    const value = this.encodeCookie(uid, sid);
    const domain = this.configService.get('IS_PROD_SERVER') ? this.configService.get('DOMAIN') : undefined;
    if (!res?.setCookie) res = this.contextService.getCurrentResponse();
    res.setCookie(name, value, { maxAge, secure: 'auto', httpOnly: true });
  }

  initCSRFToken(res: FastifyReply, sessionID: string) {
    const name = this.configService.get('CSRF_TOKEN_NAME');
    const maxAge = this.configService.get('CSRF_TOKEN_MAX_AGE') * 1000;

    const iv = crypto.randomBytes(16);
    const secretKey = this.configService.get('CSRF_SECRET_KEY');
    const payload = Date.now() + maxAge + '-' + sessionID;
    const encryptedSession = this.encrypt(iv, secretKey, payload, 'base64url');
    const token = iv.toString('base64url') + '|' + encryptedSession;

    res.setCookie(name, token, { maxAge, secure: 'auto', httpOnly: true });
  }

  async verifyCSRFToken() {
    const req = this.contextService.getCurrentRequest();
    const res = this.contextService.getCurrentResponse();

    const token = req.headers['x-csrf-token'] as string | undefined;
    if (!token) throw new AppError(ErrorCode.IAM005);
    const auth = await this.getUserFromCookie(req, res);
    const sessionID = auth?.session.id ?? DEFAULT_SESSION_ID;

    const [iv, encryptedSessionId] = token.split('|');
    if (!iv || !encryptedSessionId) return false;
    const biv = Buffer.from(iv, 'base64url');
    if (biv.length != 16) return false;
    const secretKey = this.configService.get('CSRF_SECRET_KEY');
    const result = this.decrypt(biv, secretKey, encryptedSessionId, 'base64url');

    if (result != sessionID) throw new AppError(ErrorCode.IAM005);
    this.initCSRFToken(res, sessionID);
    return true;
  }

  private generateUserSession() {
    const maxAge = this.configService.get('COOKIE_MAX_AGE');
    const expireAt = moment().add(maxAge, 'seconds').toDate();
    return { id: sagus.genRandom(32, 'base64'), expireAt };
  }

  async getUserFromCookie(req: FastifyRequest, res: FastifyReply) {
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
    const validSession = moment().isBefore(session.expireAt);
    if (!validSession) this.clearCookies(res);

    /** Setting up the request context values */
    this.contextService.setCurrentUser(user);
    this.contextService.setCurrentSession(session);

    /** Updating the expiry date of the session if it is going to expire */
    const willSessionExpire = moment().add(2, 'days').isAfter(session.expireAt);
    if (willSessionExpire) {
      const newSession = this.generateUserSession();
      await this.userModel.updateOne({ _id }, { $pull: { sessions: { id: session.id } }, $push: { sessions: newSession } });
      this.setCookies(user.uid, newSession.id, res);
      this.contextService.setCurrentSession(newSession);
      return { user, session: newSession };
    }

    return { user, session };
  }

  async initUserSession(user: User) {
    const session = this.generateUserSession();
    const validSessions = user.sessions.filter(s => s.expireAt > new Date());
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
