/**
 * Importing npm packages
 */
import { AsyncLocalStorage } from 'async_hooks';

import { type FastifyReply, type FastifyRequest } from 'fastify';
import { default as sagus } from 'sagus';

/**
 * Importing user defined packages
 */
import { type User, type UserSession } from '@app/modules/database';
import { type ArchiveRole, type ChronicleRole, type FictionRole, type IAMRole } from '@app/shared/constants';
import { type JSONData, type NonNullJSONData } from '@app/shared/interfaces';

/**
 * Defining types
 */
export interface CurrentUser extends Pick<User, 'uid' | 'email' | 'verified' | 'type'> {
  role: {
    iam: IAMRole;
    fiction: FictionRole;
    chronicle: ChronicleRole;
    archive: ArchiveRole;
  };
}

export interface CurrentUserDoc extends Pick<User, 'uid' | 'email' | 'verified' | 'type'> {
  iam: { role: IAMRole };
  fiction: { role: FictionRole };
  chronicle: { role: ChronicleRole };
  archive: { role: ArchiveRole };
}

type Middleware = (req: FastifyRequest, res: FastifyReply, next: () => void) => void;

/**
 * Declaring the constants
 */

class ContextError extends Error {
  constructor(msg?: string) {
    super(msg);
    this.name = 'ContextError';
  }
}

class ContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

  private sanitize(data: JSONData[]): NonNullJSONData[];
  private sanitize(data: Record<string, JSONData>): Record<string, NonNullJSONData>;
  private sanitize(data: Record<string, JSONData> | JSONData): Record<string, NonNullJSONData> | NonNullJSONData[] {
    /** Sanitizing array data */
    if (Array.isArray(data)) {
      const trimmedArr: NonNullJSONData[] = [];
      for (const value of data) {
        if (value === null || value === undefined) continue;
        const item = typeof value != 'object' ? value : this.sanitize(value as JSONData[]);
        trimmedArr.push(item);
      }
      return trimmedArr;
    }

    /** Sanitizing object data */
    const trimmedObj: Record<string, NonNullJSONData> = {};
    for (const [key, value] of Object.entries(data as object)) {
      if (value === null || value === undefined) continue;
      trimmedObj[key] = typeof value != 'object' ? value : this.sanitize(value);
    }
    return trimmedObj;
  }

  /** Initiates the context data store */
  init(): Middleware {
    return (req, res, next) => {
      req.body = typeof req.body === 'object' ? this.sanitize(req.body as any) : req.body;
      const store = new Map<string, any>();
      store.set('RID', sagus.genUUID());
      store.set('CURRENT_REQUEST', req);
      store.set('CURRENT_RESPONSE', res);
      this.asyncLocalStorage.run(store, () => next());
    };
  }

  getOptional<T>(key: string): T | undefined {
    return this.asyncLocalStorage.getStore()?.get(key);
  }

  get<T>(key: string, required: true): T;
  get<T>(key: string): T | undefined;
  get<T>(key: string, required?: true): T | undefined {
    const store = this.asyncLocalStorage.getStore();
    if (!store) throw new ContextError('store not initialized');
    const value = store.get(key);
    if (!value && required) throw new ContextError(`value for key '${key}' is undefined when it is required`);
    return value;
  }

  set<T>(key: string, value: T): ContextService {
    const store = this.asyncLocalStorage.getStore();
    if (!store) throw new ContextError('store not initialized');
    store.set(key, value);
    return this;
  }

  getCurrentRequest(): FastifyRequest {
    return this.get('CURRENT_REQUEST', true);
  }

  getCurrentResponse(): FastifyReply {
    return this.get('CURRENT_RESPONSE', true);
  }

  getRID(): string {
    return this.get('RID', true);
  }

  getCurrentUser(): CurrentUser | undefined;
  getCurrentUser(required: true): CurrentUser;
  getCurrentUser(required?: true): CurrentUser | undefined {
    return required ? this.get('CURRENT_USER', true) : this.get('CURRENT_USER');
  }

  setCurrentUser(user: CurrentUserDoc): ContextService;
  setCurrentUser(user: CurrentUser): ContextService;
  setCurrentUser(user: CurrentUserDoc | CurrentUser): ContextService {
    const role = 'role' in user ? user.role : { iam: user.iam.role, fiction: user.fiction.role, chronicle: user.chronicle.role, archive: user.archive.role };
    const userObj = { uid: user.uid, email: user.email, verified: user.verified, type: user.type, role: role };
    return this.set('CURRENT_USER', userObj);
  }

  getCurrentSession(): UserSession | undefined;
  getCurrentSession(required: true): UserSession;
  getCurrentSession(required?: true): UserSession | undefined {
    return required ? this.get('CURRENT_SESSION', true) : this.get('CURRENT_SESSION');
  }

  setCurrentSession(session: UserSession): ContextService {
    return this.set('CURRENT_SESSION', session);
  }
}

const globalRef = global as any;
export const Context: ContextService = globalRef.ContextService || (globalRef.ContextService = new ContextService());
