/**
 * Importing npm packages
 */
import compression from '@fastify/compress';
import { fastifyCookie } from '@fastify/cookie';
import { ShutdownSignal } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { Context } from '@app/providers/context';
import { Logger, NestLogger } from '@app/providers/logger';
import { Middleware } from '@app/shared/utils';

import { AppModule } from './app.module';

/**
 * Declaring the constants
 */
const logger = new NestLogger();
const templates = `${__dirname}/routes/views`;

async function bootstrap() {
  const adapter = new FastifyAdapter();
  const instance = adapter.getInstance();

  /** Registering fastify plugins */
  await instance.register(fastifyCookie);
  await instance.register(compression);

  /** Setting up hooks in fastify */
  instance.addHook('onRequest', Logger.getRequestStartHandler());
  instance.addHook('preHandler', Context.init());
  instance.addHook('preHandler', Middleware.initMiddlewares());
  instance.addHook('onResponse', Logger.getRequestEndHandler());

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { logger });

  /** Configuring the nestjs application */
  Middleware.setNestApplication(app);
  app.setViewEngine({ engine: { handlebars: require('handlebars') }, templates });
  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGUSR2, ShutdownSignal.SIGTERM]);

  await app.listen(Config.get('PORT'), Config.get('HOST_NAME'));
}

bootstrap();
