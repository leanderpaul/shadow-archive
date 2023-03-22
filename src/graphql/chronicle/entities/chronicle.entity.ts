/**
 * Importing npm packages
 */
import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { Expense, ExpenseConnection } from './expense.entity';
import { Metadata } from './metadata.entity';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@ObjectType()
export class Chronicle {
  @Field(() => ExpenseConnection, { description: 'Retrieves the list of expenses' })
  expenses: ExpenseConnection;

  @Field(() => Expense, { description: 'Particular expense' })
  expense?: Expense;

  @Field(() => Metadata)
  metadata: Metadata;
}
