/**
 * Importing npm packages
 */
import { Module, OnModuleInit } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

/**
 * Importing user defined packages
 */

import { ConfigModule } from './config';
import { GraphQLModule } from './graphql';
import { RoutesModule } from './routes';
import { ErrorFilter } from './shared/errors';
import { AuthService } from './shared/modules';
import { Method, Middleware } from './shared/utils';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const GlobalErrorFilter = { provide: APP_FILTER, useClass: ErrorFilter };
const RateLimiterModule = ThrottlerModule.forRoot({ limit: 10, ttl: 30 });

@Module({
  imports: [ConfigModule, RateLimiterModule, RoutesModule, GraphQLModule],
  providers: [GlobalErrorFilter],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    Middleware.addMiddleware({
      path: '*',
      method: Method.ALL,
      handler: (req, res, app) => app.get(AuthService).getCurrentUserContext(req, res),
    });
  }
}
