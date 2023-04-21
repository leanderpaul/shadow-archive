/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

/**
 * Importing user defined packages
 */
import { NotFoundFilter } from '@app/shared/errors';

import { ConfigModule } from './config';
import { GraphQLModule } from './graphql';
import { RoutesModule } from './routes';

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
export class AppModule {}
