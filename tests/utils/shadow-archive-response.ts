/**
 * Importing npm packages
 */
import { expect } from '@jest/globals';
import { type Response } from 'supertest';

/**
 * Importing user defined packages
 */
import { ErrorCode } from '@app/shared/errors';
import { Config } from '@app/shared/services';

/**
 * Defining types
 */

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
const expectRID = expect.stringMatching(/^[0-9A-F]{8}-[0-9A-F]{4}-[1][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

export class ShadowArchiveResponse {
  static cookies = new Map<string, string>();

  constructor(private readonly response: Response, isGraphQLRequest: boolean) {
    expect(response.type).toEqual(expect.stringContaining('application/json'));
    if (isGraphQLRequest) expect(response.status).toBe(200);
  }

  getBody(): Record<string, any> {
    return structuredClone(this.response.body);
  }

  getGraphQLData<T = any>(key?: string): T {
    let value = this.getBody().data;
    const keys = key?.split('.') ?? [];
    for (const k of keys) value = value[k];
    return value;
  }

  expectRESTData(obj: Record<string, unknown>): void {
    expect(this.response.body).toMatchObject(obj);
  }

  expectRESTError(code: string, type?: string): void {
    expect(this.response.body.code).toBe(code);
    expect(this.response.body.type).toBe(type || ((ErrorCode as any)[code] as ErrorCode).getType());
    expect(this.response.body.rid).toEqual(expectRID);
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
      if (cookieValue) ShadowArchiveResponse.cookies.set(key, decodeURIComponent(cookieValue));
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
