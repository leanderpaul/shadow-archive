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
import { FictionGraphQLModule } from './fiction';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [AccountsGraphQLModule, ChronicleGraphQLModule, AdminGraphQLModule, FictionGraphQLModule],
})
export class GraphQLModule {}
