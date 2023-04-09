/**
 * Importing npm packages
 */
import compression from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { NestLogger, Logger, Context } from '@app/providers';

import { AppModule } from './app.module';

/**
 * Importing and defining types
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

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
  if (Config.getNodeEnv() != 'test') app.enableShutdownHooks();
  await app.listen(Config.get('PORT'), Config.get('HOST_NAME'));
}

bootstrap();
