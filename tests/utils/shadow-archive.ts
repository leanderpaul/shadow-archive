/**
 * Importing npm packages
 */
import { fastifyCookie } from '@fastify/cookie';
import { expect } from '@jest/globals';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';

/**
 * Importing user defined packages
 */
import { AppModule } from '@app/app.module';
import { AuthService } from '@app/modules/auth';
import { DatabaseService } from '@app/modules/database';
import { Middleware } from '@app/shared/services';

import { ShadowArchiveRequest } from './shadow-archive-request';
import { TestSeeder } from './test-seeder';

/**
 * Defining types
 */
import 'expect-more-jest';
import 'jest-extended';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      toBeID(): JestMatchers<string>;
    }
  }
}

export enum GraphQLModule {
  ACCOUNTS = 'accounts',
  CHRONICLE = 'chronicle',
  FICTION = 'fiction',
}

export type RestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Declaring the constants
 */

expect.extend({
  toBeID(actual: unknown) {
    const pass = typeof actual === 'string' && /^[a-f0-9]{24}$/.test(actual);
    const message = pass ? () => `expected '${actual}' not to be ID` : () => `expected '${actual}' to be ID`;
    return { message, pass };
  },
});

export class ShadowArchive {
  private readonly store = new Map<string, any>();
  private seeder?: TestSeeder;
  private app: NestFastifyApplication;
  private inited = false;

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
    if (this.seeder) {
      const databaseService = this.app.get(DatabaseService);
      await this.seeder.init(databaseService);
    }

    const authService = this.app.get(AuthService);
    authService.verifyCSRFToken = async () => true;
    this.inited = true;
  }

  getSeeder(): TestSeeder {
    if (this.inited) throw new Error('Cannot get seeder after app has been initialized');
    if (!this.seeder) this.seeder = new TestSeeder();
    return this.seeder;
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
    return new ShadowArchiveRequest(apiRequest, this.app, this.seeder);
  }

  graphql(query: string, variables: object = {}, module?: GraphQLModule): ShadowArchiveRequest {
    const response = this.rest('POST', `/graphql/${module || this.graphqlModule}`).send({ query, variables });
    return response;
  }

  async teardown(): Promise<void> {
    await this.app.close();
  }
}
