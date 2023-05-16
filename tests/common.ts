/**
 * Importing npm packages
 */
import { fastifyCookie } from '@fastify/cookie';
import { expect } from '@jest/globals';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request, { type Request, type Response } from 'supertest';

/**
 * Importing user defined packages
 */
import { AppModule } from '@app/app.module';
import { Config } from '@app/config';
import { Context } from '@app/providers/context';
import { ErrorCode, type GraphQLFormattedErrorExtensions } from '@app/shared/errors';

/**
 * Defining types
 */

declare module 'expect' {
  export interface AsymmetricMatchers {
    nullableAny(sample: unknown): void;
  }
}

export enum GraphQLModule {
  ACCOUNTS = 'accounts',
  CHRONICLE = 'chronicle',
}

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

export interface GraphQLErrorResponse extends Response {
  body: {
    data: null;
    errors: GraphQLFormattedError[];
  };
}

export interface GraphQLDataResponse<T = any> extends Response {
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
const OContext = { ...Context };
Context.getCurrentRequest = () => OContext.getCurrentRequest() || { headers: {} };
Context.getCurrentResponse = () => OContext.getCurrentResponse() || { setCookie: jest.fn(), clearCookie: jest.fn() };

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

    const message = pass ? () => `expected ${actual} not to be Any<${type}> or Null` : () => `expected ${actual} to be Any<${type}> or Null`;

    return { message, pass };
  },
});

export class ShadowArchive {
  private app: NestFastifyApplication;

  constructor(private graphqlModule: GraphQLModule = GraphQLModule.ACCOUNTS) {}

  async setup() {
    const adapter = new FastifyAdapter();
    const instance = adapter.getInstance();
    await instance.register(fastifyCookie);
    instance.addHook('preHandler', Context.init());

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    this.app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter, { logger: false });

    await this.app.init();
    await instance.ready();
  }

  getTimeout() {
    const timeout = process.env.TEST_TIMEOUT || '5000';
    return parseInt(timeout) || 5000;
  }

  getGraphQLModule(module: GraphQLModule) {
    this.graphqlModule = module;
    return this;
  }

  rest(method: RestMethod, url: string) {
    const mtd = method.toLowerCase() as Lowercase<RestMethod>;
    const apiRequest = request(this.app.getHttpServer())[mtd](url);
    return new ShadowArchiveRequest(apiRequest);
  }

  graphql(query: string, variables: object = {}, module?: GraphQLModule) {
    const response = this.rest('POST', `/graphql/${module || this.graphqlModule}`).send({ query, variables });
    return response;
  }

  async teardown() {
    await this.app.close();
  }
}

export class ShadowArchiveRequest {
  constructor(private readonly request: Request) {}

  private async execute() {
    const response = await this.request;
    return new ShadowArchiveResponse(response, this.request.url === '/graphql');
  }

  send(data: object) {
    this.request.send(data);
    return this;
  }

  cookie(cookie: string) {
    const value = cookie.startsWith(Config.getCookieName()) ? cookie : Config.getCookieName() + '=' + cookie;
    this.request.set('Cookie', value);
    return this;
  }

  session(key: string) {
    const cookie = cookies.get(key);
    if (!cookie) throw new Error(`Cookie '${key}' not present in cookie store`);
    this.cookie(cookie);
    return this;
  }

  then(resolve: (value: ShadowArchiveResponse) => ShadowArchiveResponse, reject: (reason: any) => void) {
    return this.execute().then(resolve, reject);
  }

  catch(reject: (reason: any) => void) {
    return this.execute().then(null, reject);
  }

  finally(callback: () => void) {
    return this.execute().finally(callback);
  }
}

export class ShadowArchiveResponse {
  constructor(private readonly response: Response, isGraphQLRequest: boolean) {
    expect(response.type).toEqual(expect.stringContaining('application/json'));
    if (isGraphQLRequest) expect(response.status).toBe(200);
  }

  getBody() {
    return this.response.body;
  }

  expectRESTData(obj: Record<string, unknown>) {
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

  /**
   * Expects token to be present and if key is provided, it store cookie for future use
   * @param key
   */
  expectCookies(key?: string) {
    const cookie = this.response.get('Set-Cookie');
    expect(cookie).toEqual(expect.arrayContaining([expect.stringMatching(/^sasid=[a-zA-Z0-9%= \-/\\;]{30,}$/)]));
    if (key && cookie[0]) {
      const values = cookie[0].split(';');
      const cookieValue = values.find(v => v.startsWith(Config.get('COOKIE_NAME')));
      if (cookieValue) cookies.set(key, decodeURIComponent(cookieValue));
    }
  }

  expectGraphQLError(code: string, type?: string, index = 0) {
    const response = this.response as GraphQLErrorResponse;
    const error = response.body.errors[index] as GraphQLFormattedError;
    expect(response.body.data).toBeNull();
    expect(error.extensions.code).toBe(code);
    expect(error.extensions.type).toBe(type || ((ErrorCode as any)[code] as ErrorCode).getType());
    expect(error.extensions.rid).toEqual(expectRID);
  }

  expectGraphQLErrorFields(fields: string[], index = 0) {
    const response = this.response as GraphQLErrorResponse;
    const error = (response as GraphQLErrorResponse).body.errors[index] as GraphQLFormattedError;
    expect(error.extensions.fields).toHaveLength(fields.length);
    expect(error.extensions.fields?.map((obj: any) => obj.field)).toEqual(expect.arrayContaining(fields));
  }

  expectGraphQLData(obj: Record<string, unknown>) {
    const response = this.response as GraphQLDataResponse;
    expect(response.body.data).toBeDefined();
    expect(Object.keys(response.body.data).length).toBeGreaterThan(0);
    expect((response.body as any).errors).toBeUndefined();
    expect(this.response.body.data).toMatchObject(obj);
  }
}
