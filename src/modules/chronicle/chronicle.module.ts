/**
 * Importing npm packages
 */

import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DatabaseModule } from '@app/modules/database';

import { ExpenseInsightService } from './expense-insight.service';
import { ExpenseService } from './expense.service';
import { MemoirService } from './memoir.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [ExpenseService, MemoirService, ExpenseInsightService],
  exports: [ExpenseService, MemoirService, ExpenseInsightService],
})
export class ChronicleModule {}
