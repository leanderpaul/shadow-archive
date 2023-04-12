/**
 * Importing npm packages
 */
import fastifyCookie from '@fastify/cookie';
import request from 'supertest';

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ErrorCode } from '@app/shared/errors';

/**
 * Importing and defining types
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { GraphQLFormattedErrorExtensions } from '@app/shared/errors';
import type { Response as SupertestResponse } from 'supertest';

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

export interface Response<T = any> extends SupertestResponse {
  body: T;
}

export interface GraphQLErrorResponse extends SupertestResponse {
  body: {
    data: null;
    errors: GraphQLFormattedError[];
  };
}

export interface GraphQLDataResponse<T = any> extends SupertestResponse {
  body: {
    data: T;
  };
}

export type GraphQLResponse<T = any> = GraphQLErrorResponse | GraphQLDataResponse<T>;

/**
 * Declaring the constants
 */
const cookies = new Map<string, string>();
const expectRID = expect.stringMatching(/^[0-9A-F]{8}-[0-9A-F]{4}-[1][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

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

  async rest(method: RestMethod, url: string, cookieName?: string | null, data?: object) {
    const mtd = method.toLowerCase() as Lowercase<RestMethod>;
    const responsePromise = request(this.app.getHttpServer())[mtd](url);
    if (cookieName) {
      const cookie = cookies.get(cookieName);
      if (!cookie) throw new Error(`Cookie '${cookieName}' not present`);
      responsePromise.set('Cookie', cookie);
    }
    const response = await responsePromise.send(data);
    expect(response.type).toEqual(expect.stringContaining('application/json'));
    return new ShadowArchiveResponse(response);
  }

  async graphql(query: string, variables: object = {}, cookieName?: string) {
    const response = await this.rest('POST', '/graphql', cookieName, { query, variables });
    response.expectStatusCode(200);
    return response;
  }

  async teardown() {
    await this.app.close();
  }
}

export class ShadowArchiveResponse {
  constructor(private readonly response: SupertestResponse) {}

  getBody() {
    return this.response.body;
  }

  expectRESTData(obj: object) {
    expect(this.getBody()).toMatchObject(obj);
  }

  expectRESTError(code: string, type?: string) {
    const error = this.getBody();
    expect(error.code).toBe(code);
    expect(error.type).toBe(type || ((ErrorCode as any)[code] as ErrorCode).getType());
    expect(error.rid).toEqual(expectRID);
  }

  expectStatusCode(statusCode: number) {
    expect(this.response.statusCode).toBe(statusCode);
  }

  expectCookies() {
    expect(this.response.get('Set-Cookie')).toEqual(expect.arrayContaining([expect.stringMatching(/^sasid=[a-zA-Z0-9%= \-;]{30,}$/)]));
  }

  expectGraphQLError(code: string, type?: string, index = 0) {
    const response = this.response as GraphQLErrorResponse;
    const error = response.body.errors[index]!;
    expect(response.body.data).toBeNull();
    expect(error.extensions.code).toBe(code);
    expect(error.extensions.type).toBe(type || ((ErrorCode as any)[code] as ErrorCode).getType());
    expect(error.extensions.rid).toEqual(expectRID);
  }

  expectGraphQLErrorFields(fields: string[], index = 0) {
    const response = this.response as GraphQLErrorResponse;
    const error = (response as GraphQLErrorResponse).body.errors[index]!;
    expect(error.extensions.fields).toHaveLength(fields.length);
    expect(error.extensions.fields?.map((obj: any) => obj.field)).toEqual(expect.arrayContaining(fields));
  }

  expectGraphQLData(obj: object) {
    const response = this.response as GraphQLDataResponse;
    expect(response.body.data).toBeDefined();
    expect(Object.keys(response.body.data).length).toBeGreaterThan(0);
    expect((response.body as any).errors).toBeUndefined();
    expect(this.response.body.data).toMatchObject(obj);
  }
}
