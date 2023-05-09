/**
 * Importing npm packages
 */
import { ArgsType, Field, Float, InputType, Int, PartialType, registerEnumType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { IntQuery, PageInput, SortOrder } from '@app/graphql/common';

import { Currency } from './expense.entity';

/**
 * Defining types
 */

export enum ExpenseSortField {
  DATE = 'date',
  TOTAL = 'total',
}

/**
 * Declaring the constants
 */

registerEnumType(ExpenseSortField, { name: 'ExpenseSortField' });

@InputType()
export class ExpenseQuery {
  @Field({ nullable: true })
  store?: string;

  @Field(() => IntQuery, { nullable: true })
  date?: IntQuery;

  @Field(() => Currency, { nullable: true })
  currency?: Currency;

  @Field(() => IntQuery, { nullable: true })
  total?: IntQuery;

  @Field({ nullable: true })
  pm?: string;
}

@InputType()
export class ExpenseSort {
  @Field(() => ExpenseSortField)
  field: ExpenseSortField;

  @Field(() => SortOrder, { defaultValue: SortOrder.ASC, nullable: true })
  order: SortOrder;
}

@InputType()
export class ExpenseItemInput {
  @Field({ description: 'Name of the item' })
  name: string;

  @Field(() => Float, { description: 'Price of a single unit item' })
  price: number;

  @Field(() => Float, { description: 'Quantity of the item', nullable: true, defaultValue: 1 })
  qty: number;
}

@InputType()
export class AddExpenseInput {
  @Field({ description: 'Bill ID', nullable: true })
  bid?: string;

  @Field(() => Int, { description: 'Bill date in format YYMMDD' })
  date: number;

  @Field(() => Int, { description: 'Bill time in 24hr format HHMM', nullable: true })
  time?: number;

  @Field({ description: 'Store from which the expense is made' })
  store: string;

  @Field({ description: 'Store location or branch name', nullable: true })
  storeLoc?: string;

  @Field({ description: 'Payment mode or method', nullable: true })
  pm?: string;

  @Field({ description: 'Description', nullable: true })
  desc?: string;

  @Field(() => [ExpenseItemInput], { description: 'Bill items' })
  items: ExpenseItemInput[];

  @Field(() => Currency, { description: 'Bill currency' })
  currency: Currency;
}

@InputType()
export class UpdateExpenseInput extends PartialType(AddExpenseInput) {}

@ArgsType()
export class GetExpensesArgs {
  @Field(() => ExpenseQuery, { nullable: true })
  query?: ExpenseQuery;

  @Field(() => PageInput, { nullable: true })
  page: PageInput = { offset: 0, limit: 20 };

  @Field(() => ExpenseSort, { nullable: true })
  sort: ExpenseSort = { field: ExpenseSortField.DATE, order: SortOrder.DESC };
}
