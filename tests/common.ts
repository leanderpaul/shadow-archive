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
import { ErrorCode } from '@app/shared/errors';
import { Config, Middleware } from '@app/shared/services';

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
  extensions: any;
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

  async setup(): Promise<void> {
    const adapter = new FastifyAdapter();
    const instance = adapter.getInstance();

    await instance.register(fastifyCookie);

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    this.app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter, { logger: false });
    Middleware.init(this.app, instance);

    await this.app.init();
    await instance.ready();
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
    return new ShadowArchiveRequest(apiRequest);
  }

  graphql(query: string, variables: object = {}, module?: GraphQLModule): ShadowArchiveRequest {
    const response = this.rest('POST', `/graphql/${module || this.graphqlModule}`).send({ query, variables });
    return response;
  }

  async teardown(): Promise<void> {
    await this.app.close();
  }
}

export class ShadowArchiveRequest {
  constructor(private readonly request: Request) {}

  private async execute(): Promise<ShadowArchiveResponse> {
    const response = await this.request;
    return new ShadowArchiveResponse(response, this.request.url === '/graphql');
  }

  send(data: object): ShadowArchiveRequest {
    this.request.send(data);
    return this;
  }

  cookie(cookie: string): ShadowArchiveRequest {
    const cookieName = Config.get('cookie.name');
    const value = cookie.startsWith(cookieName) ? cookie : cookieName + '=' + cookie;
    this.request.set('Cookie', value);
    return this;
  }

  session(key: string): ShadowArchiveRequest {
    const cookie = cookies.get(key);
    if (!cookie) throw new Error(`Cookie '${key}' not present in cookie store`);
    this.cookie(cookie);
    return this;
  }

  then(resolve: (value: ShadowArchiveResponse) => ShadowArchiveResponse, reject: (reason: any) => void): Promise<ShadowArchiveResponse | void> {
    return this.execute().then(resolve, reject);
  }

  catch(reject: (reason: any) => void): Promise<ShadowArchiveResponse | void> {
    return this.execute().then(null, reject);
  }

  finally(callback: () => void): Promise<ShadowArchiveResponse> {
    return this.execute().finally(callback);
  }
}

export class ShadowArchiveResponse {
  constructor(private readonly response: Response, isGraphQLRequest: boolean) {
    expect(response.type).toEqual(expect.stringContaining('application/json'));
    if (isGraphQLRequest) expect(response.status).toBe(200);
  }

  getBody(): Record<string, any> {
    return this.response.body;
  }

  expectRESTData(obj: Record<string, unknown>): void {
    expect(this.getBody()).toMatchObject(obj);
  }

  expectRESTError(code: string, type?: string): void {
    const error = this.getBody();
    expect(error.code).toBe(code);
    expect(error.type).toBe(type || ((ErrorCode as any)[code] as ErrorCode).getType());
    expect(error.rid).toEqual(expectRID);
  }

  expectStatusCode(statusCode: number): void {
    expect(this.response.statusCode).toBe(statusCode);
  }

  /**
   * Expects token to be present and if key is provided, it store cookie for future use
   * @param key
   */
  expectCookies(key?: string): void {
    const cookie = this.response.get('Set-Cookie');
    expect(cookie).toEqual(expect.arrayContaining([expect.stringMatching(/^sasid=[a-zA-Z0-9%= \-/\\;]{30,}$/)]));
    if (key && cookie[0]) {
      const values = cookie[0].split(';');
      const cookieName = Config.get('cookie.name');
      const cookieValue = values.find(v => v.startsWith(cookieName));
      if (cookieValue) cookies.set(key, decodeURIComponent(cookieValue));
    }
  }

  expectGraphQLError(code: string, type?: string, index = 0): void {
    const response = this.response as GraphQLErrorResponse;
    const error = response.body.errors[index] as GraphQLFormattedError;
    expect(response.body.data).toBeNull();
    expect(error.extensions.code).toBe(code);
    expect(error.extensions.type).toBe(type || ((ErrorCode as any)[code] as ErrorCode).getType());
    expect(error.extensions.rid).toEqual(expectRID);
  }

  expectGraphQLErrorFields(fields: string[], index = 0): void {
    const response = this.response as GraphQLErrorResponse;
    const error = (response as GraphQLErrorResponse).body.errors[index] as GraphQLFormattedError;
    expect(error.extensions.fields).toHaveLength(fields.length);
    expect(error.extensions.fields?.map((obj: any) => obj.field)).toEqual(expect.arrayContaining(fields));
  }

  expectGraphQLData(obj: Record<string, unknown>): void {
    const response = this.response as GraphQLDataResponse;
    expect(response.body.data).toBeDefined();
    expect(Object.keys(response.body.data).length).toBeGreaterThan(0);
    expect((response.body as any).errors).toBeUndefined();
    expect(this.response.body.data).toMatchObject(obj);
  }
}
