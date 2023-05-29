/**
 * Importing npm packages
 */
import { fastifyCookie } from '@fastify/cookie';
import { expect } from '@jest/globals';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { default as sagus } from 'sagus';
import { default as request } from 'supertest';

/**
 * Importing user defined packages
 */
import { AppModule } from '@app/app.module';
import { AuthService } from '@app/modules/auth';
import { DatabaseService, NativeUser, OAuthUser, type User } from '@app/modules/database';
import { UserService } from '@app/modules/user';
import { Middleware } from '@app/shared/services';

import { ShadowArchiveRequest } from './shadow-archive-request';
import { ShadowArchiveResponse } from './shadow-archive-response';

/**
 * Defining types
 */

declare module 'expect' {
  export interface AsymmetricMatchers {
    nullableAny(sample: unknown): void;
    toBeID(): void;
  }
}

export enum GraphQLModule {
  ACCOUNTS = 'accounts',
  CHRONICLE = 'chronicle',
}

export type RestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Declaring the constants
 */

expect.extend({
  nullableAny(actual: unknown, sample: unknown) {
    if (typeof sample === 'undefined') throw new TypeError('optionalAny() expects to be passed a constructor function.');

    let pass: boolean;
    let type: string;
    if (sample == String) {
      type = 'string';
      pass = typeof actual == 'string' || actual instanceof String;
    } else if (sample == Number) {
      type = 'number';
      pass = typeof actual == 'number' || actual instanceof Number;
    } else if (sample == Function) {
      type = 'function';
      pass = typeof actual == 'function' || actual instanceof Function;
    } else if (sample == Boolean) {
      type = 'boolean';
      pass = typeof actual == 'boolean' || actual instanceof Boolean;
    } else if (sample == BigInt) {
      type = 'BigInt';
      pass = typeof actual == 'bigint' || actual instanceof BigInt;
    } else if (sample == Symbol) {
      type = 'symbol';
      pass = typeof actual == 'symbol' || actual instanceof Symbol;
    } else if (sample == Object) {
      type = 'object';
      pass = typeof actual == 'object';
    } else {
      type = (sample as any).name;
      pass = actual instanceof (sample as any);
    }
    if (actual === null) pass = true;

    const message = pass ? () => `expected '${actual}' not to be Any<${type}> or Null` : () => `expected '${actual}' to be Any<${type}> or Null`;

    return { message, pass };
  },

  toBeID(actual: unknown) {
    const pass = typeof actual === 'string' && /^[a-f0-9]{24}$/.test(actual);
    const message = pass ? () => `expected '${actual}' not to be ID` : () => `expected '${actual}' to be ID`;
    return { message, pass };
  },
});

export class ShadowArchive {
  private readonly store = new Map<string, any>();
  private app: NestFastifyApplication;

  constructor(private graphqlModule: GraphQLModule = GraphQLModule.ACCOUNTS) {}

  async setup(): Promise<void> {
    const adapter = new FastifyAdapter();
    const instance = adapter.getInstance();

    await instance.register(fastifyCookie);

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    this.app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter, { logger: false });
    Middleware.init(this.app, instance);

    await this.app.init();
    await instance.ready();

    const authService = this.app.get(AuthService);
    authService.verifyCSRFToken = async () => true;
  }

  getDatabaseService(): DatabaseService {
    return this.app.get(DatabaseService);
  }

  async createUser(email: string, name: string, verified?: boolean): Promise<User> {
    const userService = this.app.get(UserService);
    const user = await userService.createUser({ email, name, password: 'Password@123', verified }, { id: 1 });
    const cookie = user.uid.toString() + '|' + user.sessions[0]?.token;
    ShadowArchiveResponse.cookies.set(user.email, cookie);
    return user;
  }

  async createUserSession(email: string): Promise<User> {
    const databaseService = this.app.get(DatabaseService);
    const userModel = databaseService.getUserModel();
    const user = await userModel.findOne({ email }).lean();
    if (!user) throw new Error(`User '${email}' not present`);
    const id = (user.sessions[user.sessions.length - 1]?.id ?? 0) + 1;
    const token = sagus.genRandom(32, 'base64');
    await userModel.updateOne({ email }, { $push: { sessions: { id, token } } });
    const cookie = user.uid.toString() + '|' + token;
    ShadowArchiveResponse.cookies.set(user.email, cookie);
    return user;
  }

  async getUser(email: string): Promise<NativeUser & OAuthUser> {
    const databaseService = this.app.get(DatabaseService);
    const userModel = databaseService.getUserModel();
    const user = await userModel.findOne({ email }).lean();
    if (!user) throw new Error(`User '${email}' not present`);
    return user as any;
  }

  storeData<T>(id: string, value: T): ShadowArchive {
    this.store.set(id, value);
    return this;
  }

  getStoredData<T = any>(id: string): T {
    const data = this.store.get(id);
    if (!data) throw new Error(`Data for id '${id}' not present in store`);
    return data;
  }

  getTimeout(): number {
    const timeout = process.env.TEST_TIMEOUT || '5000';
    return parseInt(timeout) || 5000;
  }

  getGraphQLModule(module: GraphQLModule): ShadowArchive {
    this.graphqlModule = module;
    return this;
  }

  rest(method: RestMethod, url: string): ShadowArchiveRequest {
    const mtd = method.toLowerCase() as Lowercase<RestMethod>;
    const apiRequest = request(this.app.getHttpServer())[mtd](url);
    return new ShadowArchiveRequest(apiRequest, this.app);
  }

  graphql(query: string, variables: object = {}, module?: GraphQLModule): ShadowArchiveRequest {
    const response = this.rest('POST', `/graphql/${module || this.graphqlModule}`).send({ query, variables });
    return response;
  }

  async teardown(): Promise<void> {
    await this.app.close();
  }
}
