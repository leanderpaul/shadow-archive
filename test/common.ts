/**
 * Importing npm packages
 */
import fastifyCookie from '@fastify/cookie';
import request from 'supertest';

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

/**
 * Importing and defining types
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { GraphQLFormattedErrorExtensions } from '@app/shared/errors';

export type RestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface SourceLocation {
  line: number;
  column: number;
}

export interface GraphQLFormattedError {
  message: string;
  locations: SourceLocation[];
  path: (string | number)[];
  extensions: GraphQLFormattedErrorExtensions;
}

/**
 * Classes
 */

export class ShadowArchive {
  private app: NestFastifyApplication;

  async setup() {
    const { AppModule } = await import('@app/app.module');
    const { Context } = await import('@app/providers');

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    this.app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { logger: false });
    const instance = this.app.getHttpAdapter().getInstance();
    await instance.register(fastifyCookie);
    instance.addHook('preHandler', Context.init());

    await this.app.init();
    await instance.ready();
  }

  async rest(method: RestMethod, url: string, data?: object) {
    const mtd = method.toLowerCase() as Lowercase<RestMethod>;
    const response = await request(this.app.getHttpServer())[mtd](url).send(data);
    expect(response.type).toEqual(expect.stringContaining('application/json'));
    return response;
  }

  async rawGraphql(query: string, variables: object = {}) {
    const response = await this.rest('POST', '/graphql', { query, variables });
    expect(response.statusCode).toBe(200);
    return response;
  }

  async graphql<T = any>(query: string, variables: object = {}) {
    const response = await this.rawGraphql(query, variables);
    return response.body as { data: T; errors: GraphQLFormattedError[] };
  }

  async teardown() {
    await this.app.close();
  }
}
