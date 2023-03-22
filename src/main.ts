/**
 * Importing npm packages
 */
import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { NestLogger, Logger, Context } from '@app/providers';
import { AppError } from '@app/shared/errors';

import { AppModule } from './app.module';

/**
 * Importing and defining types
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

/**
 * Declaring the constants
 */
const logger = new NestLogger();
const validationPipe = new ValidationPipe({
  validationError: { target: true, value: true },
  exceptionFactory: errors => new AppError('CLIENT_ERROR', 'Class validation failed', errors),
});

async function bootstrap() {
  const adapter = new FastifyAdapter();
  const instance = adapter.getInstance();
  instance.addHook('onRequest', Logger.getRequestStartHandler());
  instance.addHook('preHandler', Context.init());
  instance.addHook('onResponse', Logger.getRequestEndHandler());

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { logger });
  app.useGlobalPipes(validationPipe);
  await app.register(fastifyCookie);
  await app.listen(Config.get('PORT'), Config.get('HOST_NAME'));
}

bootstrap();
