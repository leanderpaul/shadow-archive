/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AccountsGraphQLModule } from './accounts';
import { AdminGraphQLModule } from './admin';
import { ChronicleGraphQLModule } from './chronicle';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [AccountsGraphQLModule, ChronicleGraphQLModule, AdminGraphQLModule],
})
export class GraphQLModule {}
