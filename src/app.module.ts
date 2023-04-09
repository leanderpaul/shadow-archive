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
import { DatabaseModule } from './providers';
import { RoutesModule } from './routes';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */
const NotFoundProvider = { provide: APP_FILTER, useClass: NotFoundFilter };
const RateLimiterModule = ThrottlerModule.forRoot({ limit: 10, ttl: 30 });
DatabaseModule.global = true;

@Module({
  imports: [ConfigModule, DatabaseModule, RateLimiterModule, RoutesModule, GraphQLModule],
  providers: [NotFoundProvider],
})
export class AppModule {}
