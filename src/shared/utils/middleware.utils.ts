/**
 * Importing npm packages
 */
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  ALL = '*',
}

interface MiddlewareInstance {
  path: string | RegExp;
  method: Method;
  handler: (req: FastifyRequest, res: FastifyReply, app: NestFastifyApplication) => Promise<any>;
}

/**
 * Declaring the constants
 */

export class Middleware {
  private static readonly instances: MiddlewareInstance[] = [];
  private static app: NestFastifyApplication;

  static addMiddleware(instance: MiddlewareInstance) {
    Middleware.instances.push(instance);
    return this;
  }

  static setNestApplication(app: NestFastifyApplication) {
    Middleware.app = app;
    return this;
  }

  static initMiddlewares() {
    return async function (req: FastifyRequest, res: FastifyReply) {
      for (const instance of Middleware.instances) {
        const matchesPath = instance.path === '*' ? true : instance.path instanceof RegExp ? instance.path.test(req.url) : instance.path === req.url;
        const matchesMethod = instance.method === Method.ALL ? true : req.method === instance.method;
        if (matchesPath && matchesMethod) await instance.handler(req, res, Middleware.app);
      }
    };
  }
}
