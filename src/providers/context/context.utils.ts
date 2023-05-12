/**
 * Importing npm packages
 */
import { AsyncLocalStorage } from 'async_hooks';

import { type FastifyReply, type FastifyRequest } from 'fastify';
import sagus from 'sagus';

/**
 * Importing user defined packages
 */
import { type User, type UserSession } from '@app/providers/database';
import { Utils } from '@app/shared/utils/common.utils';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

export const Context = {
  init() {
    return (req: FastifyRequest, res: FastifyReply, next: () => void) => {
      req.body = typeof req.body === 'object' ? Utils.sanitize(req.body as object) : req.body;
      const store = new Map<string, any>();
      store.set('RID', sagus.genUUID());
      store.set('CURRENT_REQUEST', req);
      store.set('CURRENT_RESPONSE', res);
      asyncLocalStorage.run(store, () => next());
    };
  },

  getCurrentRequest(): FastifyRequest {
    return asyncLocalStorage.getStore()?.get('CURRENT_REQUEST');
  },

  getCurrentResponse(): FastifyReply {
    return asyncLocalStorage.getStore()?.get('CURRENT_RESPONSE');
  },

  getRID(): string {
    return asyncLocalStorage.getStore()?.get('RID');
  },

  get<T>(key: string): T | undefined {
    return asyncLocalStorage.getStore()?.get(key);
  },

  set<T>(key: string, value: T) {
    asyncLocalStorage.getStore()?.set(key, value);
    return this;
  },

  getCurrentUser() {
    return Context.get<User>('CURRENT_USER');
  },

  setCurrentUser(user: User) {
    Context.set('CURRENT_USER', user);
    return this;
  },

  getCurrentSession() {
    return Context.get<UserSession>('CURRENT_SESSION');
  },

  setCurrentSession(session: UserSession) {
    Context.set('CURRENT_SESSION', session);
    return this;
  },
};
