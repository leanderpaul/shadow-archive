/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { DatabaseModule } from '@app/providers/database';

import { ExpenseService } from './expense.service';
import { ExpenseResolver } from './expense.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [ExpenseResolver, ExpenseService, ContextService],
})
export class ExpenseModule {}