/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';

import { Context } from './context.utils';

/**
 * Importing and defining types
 */
import type { User, UserSession } from '@app/providers/database';

/**
 * Declaring the constants
 */

@Injectable()
export class ContextService {
  getCurrentRequest() {
    return Context.getCurrentRequest();
  }

  getCurrentResponse() {
    return Context.getCurrentResponse();
  }

  getRID() {
    return Context.getRID();
  }

  getCurrentUser(required?: false): User | undefined;
  getCurrentUser(required: true): User;
  getCurrentUser(required?: boolean) {
    const user = Context.getCurrentUser();
    if (!user && required) throw new AppError(ErrorCode.IAM009);
    return user;
  }

  setCurrentUser(user: User) {
    Context.setCurrentUser(user);
    return this;
  }

  getCurrentSession(required?: false): UserSession | undefined;
  getCurrentSession(required: true): UserSession;
  getCurrentSession(requried?: boolean) {
    const session = Context.getCurrentSession();
    if (!session && requried) throw new AppError(ErrorCode.IAM009);
    return session;
  }

  setCurrentSession(session: UserSession) {
    Context.setCurrentSession(session);
    return this;
  }
}
