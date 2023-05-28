/**
 * Importing npm packages
 */
import { Module, type OnModuleInit } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

/**
 * Importing user defined packages
 */

import { GraphQLModule } from './graphql';
import { AuthService } from './modules/auth';
import { RoutesModule } from './routes';
import { ErrorFilter } from './shared/errors';
import { Middleware } from './shared/services';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const GlobalErrorFilter = { provide: APP_FILTER, useClass: ErrorFilter };
const RateLimiterModule = ThrottlerModule.forRoot({ limit: 10, ttl: 30 });

@Module({
  imports: [RateLimiterModule, RoutesModule, GraphQLModule],
  providers: [GlobalErrorFilter],
})
export class AppModule implements OnModuleInit {
  onModuleInit(): void {
    Middleware.add({ handler: (_req, _res, app) => app.get(AuthService).authenticate() });
  }
}
