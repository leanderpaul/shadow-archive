/**
 * Importing npm packages
 */
import compression from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { Context } from '@app/providers/context';
import { Logger, NestLogger } from '@app/providers/logger';

import { AppModule } from './app.module';

/**
 * Declaring the constants
 */
const logger = new NestLogger();

async function bootstrap() {
  const adapter = new FastifyAdapter();
  const instance = adapter.getInstance();

  /** Registering fastify plugins */
  await instance.register(fastifyCookie);
  await instance.register(compression);

  /** Setting up hooks in fastify */
  instance.addHook('onRequest', Logger.getRequestStartHandler());
  instance.addHook('preHandler', Context.init());
  instance.addHook('onResponse', Logger.getRequestEndHandler());

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { logger });
  app.enableShutdownHooks();
  await app.listen(Config.get('PORT'), Config.get('HOST_NAME'));
}

bootstrap();
