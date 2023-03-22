/**
 * Importing npm packages
 */
import { ArgsType, Field } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { PageInput, SortOrder } from '@app/graphql/common';
import { ExpenseQuery, ExpenseSort, ExpenseSortField } from './expense.inputs';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@ArgsType()
export class GetExpensesArgs {
  @Field(() => ExpenseQuery, { nullable: true })
  query?: ExpenseQuery;

  @Field(() => PageInput, { nullable: true })
  page: PageInput = { offset: 0, limit: 20 };

  @Field(() => ExpenseSort, { nullable: true })
  sort: ExpenseSort = { field: ExpenseSortField.DATE, order: SortOrder.DESC };
}
