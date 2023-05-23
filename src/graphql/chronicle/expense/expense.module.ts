/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { DatabaseModule } from '@app/modules/database';

import { ExpenseResolver } from './expense.resolver';
import { ExpenseService } from './expense.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [ExpenseResolver, ExpenseService, GraphQLService],
})
export class ExpenseModule {}
