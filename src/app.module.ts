/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ConfigModule } from '@app/config';
import { GraphQLModule } from '@app/graphql';
import { DatabaseModule } from '@app/providers';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */
DatabaseModule.global = true;

@Module({
  imports: [ConfigModule, GraphQLModule, DatabaseModule],
  providers: [],
})
export class AppModule {}
