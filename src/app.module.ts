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
import { NotFoundFilter } from './shared/errors';
import { AuthService } from './shared/modules';
import { Method, Middleware } from './shared/utils';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const NotFoundProvider = { provide: APP_FILTER, useClass: NotFoundFilter };
const RateLimiterModule = ThrottlerModule.forRoot({ limit: 10, ttl: 30 });

@Module({
  imports: [ConfigModule, RateLimiterModule, RoutesModule, GraphQLModule],
  providers: [NotFoundProvider],
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
