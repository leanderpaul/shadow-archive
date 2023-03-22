/**
 * Importing npm packages
 */
import crypto from 'crypto';
import moment from 'moment';
import sagus from 'sagus';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { User, DBUtils, NativeUser, ContextService } from '@app/providers';

/**
 * Importing and defining types
 */
import type { ConfigRecord } from '@app/config';
import type { UserModel, NativeUserModel } from '@app/providers';
import type { FastifyRequest, FastifyReply } from 'fastify';

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

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService<ConfigRecord>,
    private contextService: ContextService,
    @InjectModel(User.name) private userModel: UserModel,
    @InjectModel(NativeUser.name) private nativeUserModel: NativeUserModel,
  ) {}

  private encrypt(iv: string | Buffer, secretKey: Buffer, input: string) {
    const biv = typeof iv === 'string' ? Buffer.from(iv, 'base64') : iv;
    const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, biv);
    const result = Buffer.concat([cipher.update(input), cipher.final()]);
    return result.toString('base64');
  }

  private decrypt(iv: string | Buffer, secretKey: Buffer, encryptedinput: string) {
    const biv = typeof iv === 'string' ? Buffer.from(iv, 'base64') : iv;
    const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, biv);
    const result = Buffer.concat([decipher.update(Buffer.from(encryptedinput, 'base64')), decipher.final()]);
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
    const secure = this.configService.get('IS_PROD_SERVER');
    if (!res?.setCookie) res = this.contextService.getCurrentResponse();
    res.setCookie(name, value, { maxAge, secure });
  }

  generateCSRFToken(sessionID: string) {
    const iv = crypto.randomBytes(16);
    const secretKey = this.configService.get('CSRF_SECRET_KEY');
    const encryptedSession = this.encrypt(iv, secretKey, sessionID);
    return iv.toString('base64') + '|' + encryptedSession;
  }

  async verifyCSRFToken(token: string, sessionID: string) {
    const [iv, encryptedSessionId] = token.split('|');
    if (!iv || !encryptedSessionId) return false;
    const biv = Buffer.from(iv, 'base64');
    if (biv.length != 16) return false;
    const secretKey = this.configService.get('CSRF_SECRET_KEY');
    const result = this.decrypt(biv, secretKey, encryptedSessionId);
    return result === sessionID;
  }

  private generateUserSession() {
    const maxAge = this.configService.get('COOKIE_MAX_AGE');
    const expireAt = moment().add(maxAge, 'seconds').toDate();
    return { id: sagus.genRandom(32, 'base64'), expireAt };
  }

  async getUserFromCookie(req: FastifyRequest, res: FastifyReply) {
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
    await this.userModel.updateOne({ _id: user._id }, { $push: { sessions: session } });
    this.setCookies(user.uid, session.id);
    this.contextService.setCurrentSession(session);
    return session;
  }

  async createUser(newUser: ICreateUser) {
    const { createSession = false, ...userObj } = newUser;
    const sessions = createSession ? [this.generateUserSession()] : [];
    const user = await this.nativeUserModel.create({ ...userObj, sessions });
    if (createSession && user.sessions[0]) {
      const session = user.sessions[0];
      this.setCookies(user.uid, session.id);
      this.contextService.setCurrentUser(user);
      this.contextService.setCurrentSession(session);
    }
    return user;
  }

  async removeSession(user: User, sessionId: string) {
    const updateSession = sessionId === '*' ? { $set: { sessions: [] } } : { $pull: { sessions: { id: sessionId } } };
    await this.userModel.updateOne({ _id: user._id }, updateSession);
    this.clearCookies();
  }
}
