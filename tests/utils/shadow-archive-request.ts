/**
 * Importing npm packages
 */
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { type Request } from 'supertest';

/**
 * Importing user defined packages
 */
import { MailService } from '@app/providers/mail';
import { Config } from '@app/shared/services';

import { ShadowArchiveResponse } from './shadow-archive-response';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export class ShadowArchiveRequest {
  constructor(private readonly request: Request, private readonly app: NestFastifyApplication) {}

  private async execute(): Promise<ShadowArchiveResponse> {
    const response = await this.request;
    const cookies = response.get('Set-Cookie');
    if (cookies?.join('').startsWith(Config.get('cookie.name') + '=;')) {
      const cookie = this.request.get('cookie');
      for (const [name, value] of ShadowArchiveResponse.cookies.entries()) {
        if (value === cookie) {
          ShadowArchiveResponse.cookies.delete(name);
          break;
        }
      }
    }
    return new ShadowArchiveResponse(response, this.request.url === '/graphql');
  }

  setMailMock(fn: jest.Mock): ShadowArchiveRequest {
    const mailService = this.app.get(MailService);
    mailService.sendMail = fn;
    return this;
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

  header(key: string, value: string): ShadowArchiveRequest {
    this.request.set(key, value);
    return this;
  }

  session(key: string): ShadowArchiveRequest {
    const cookie = ShadowArchiveResponse.cookies.get(key);
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
