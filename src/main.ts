/**
 * Importing npm packages
 */
import compression from '@fastify/compress';
import { fastifyCookie } from '@fastify/cookie';
import { ShutdownSignal } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

/**
 * Importing user defined packages
 */
import { AppModule } from './app.module';
import { Logger } from './providers/logger';
import { Config, Middleware } from './shared/services';

/**
 * Declaring the constants
 */
const logger = Logger.getNestLogger('Nest');
const templates = `${__dirname}/routes/views`;

export async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter();
  const instance = adapter.getInstance();

  /** Registering fastify plugins */
  await instance.register(fastifyCookie);
  await instance.register(compression);

  /** Configuring the nestjs application */
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { logger });
  Middleware.init(app, instance);
  app.setViewEngine({ engine: { handlebars: require('handlebars') }, templates });
  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGUSR2, ShutdownSignal.SIGTERM]);

  await app.listen(Config.get('app.port'), Config.get('app.hostname'));
}

bootstrap();
