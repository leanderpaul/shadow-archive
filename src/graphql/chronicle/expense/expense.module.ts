/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { ChronicleModule } from '@app/modules/chronicle';

import { ExpenseResolver } from './expense.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [ChronicleModule],
  providers: [ExpenseResolver, GraphQLService],
})
export class ExpenseModule {}
