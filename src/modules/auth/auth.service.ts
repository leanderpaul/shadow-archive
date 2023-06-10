/**
 * Importing npm packages
 */
import crypto from 'crypto';

import { Injectable } from '@nestjs/common';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { DatabaseService } from '@app/modules/database';
import { CookieService, type UserCookie } from '@app/modules/user';
import { Logger } from '@app/providers/logger';
import { AppError, ErrorCode } from '@app/shared/errors';
import { Config, Context } from '@app/shared/services';

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
const AUTH_INITED = 'AUTH_INITED';

@Injectable()
export class AuthService {
  private readonly logger = Logger.getLogger(AuthService.name);
  private readonly userModel;

  constructor(databaseService: DatabaseService, private readonly cookieService: CookieService) {
    this.userModel = databaseService.getUserModel();
  }

  private async authenticateUser(cookieData: UserCookie): Promise<void> {
    /** Verifying the cookie data */
    const maxAge = Config.get('cookie.max-age');
    const promise = this.userModel.findOneAndUpdate({ uid: cookieData.uid }, {}, { runValidators: false });
    promise.setUpdate({ $pull: { sessions: { accessedAt: { $lt: moment().subtract(maxAge, 'seconds').toDate() } } } });
    promise.projection('uid email admin verified sessions');
    const user = await promise.lean();
    if (!user) return this.cookieService.clearCookies();
    const session = user.sessions.find(s => s.token === cookieData.token);
    if (!session) return this.cookieService.clearCookies();

    /** Updating the last accessed time in user seesion */
    this.userModel
      .updateOne({ uid: cookieData.uid, 'sessions.id': session.id }, { $set: { 'sessions.$.accessedAt': new Date() } })
      .catch(err => this.logger.error(err, { message: 'Failed updating last accessed time in user session' }));

    /** Setting up the request context values */
    Context.setCurrentUser(user);
    Context.setCurrentSession(session);
  }

  async authenticate(): Promise<void> {
    if (Context.get<true>(AUTH_INITED)) return;
    else Context.set(AUTH_INITED, true);

    const cookieData = this.cookieService.getUserCookies();
    if (cookieData) return this.authenticateUser(cookieData);
  }

  generateCSRFToken(expireAt?: moment.Moment): string {
    if (!expireAt) expireAt = moment().add(1, 'hour');
    const session = Context.getCurrentSession(true);
    const md5 = crypto.createHash('md5');
    const payload = expireAt.unix() + '|' + session.token;
    return expireAt.unix() + '|' + md5.update(payload).digest('base64url');
  }

  async verifyCSRFToken(): Promise<true> {
    const { headers } = Context.getCurrentRequest();
    const token = headers['x-csrf-token'] as string | undefined;
    if (!token) throw new AppError(ErrorCode.IAM005);
    const user = Context.getCurrentUser();
    if (!user) throw new AppError(ErrorCode.IAM002);

    const [expireAt] = token.split('|');
    const expiryDate = moment(expireAt, 'X');
    if (expiryDate.isBefore()) throw new AppError(ErrorCode.IAM005);
    const csrfToken = this.generateCSRFToken(expiryDate);
    if (token != csrfToken) throw new AppError(ErrorCode.IAM005);

    return true;
  }
}
