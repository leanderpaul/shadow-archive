/**
 * Importing npm packages
 */
import { ArgsType, Field, Float, ID, InputType, Int, PartialType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { PageInput, SortOrder } from '@app/graphql/common';
import { Currency, ExpenseCategory, ExpenseVisibiltyLevel } from '@app/modules/database';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@InputType()
export class ExpenseFilter {
  @Field({ nullable: true })
  store?: string;

  @Field(() => Int, { nullable: true })
  fromDate?: number;

  @Field(() => Int, { nullable: true })
  toDate?: number;

  @Field(() => [ExpenseVisibiltyLevel], { nullable: true })
  levels?: ExpenseVisibiltyLevel[];

  @Field(() => ExpenseCategory, { nullable: true })
  category?: ExpenseCategory;

  @Field(() => Currency, { nullable: true })
  currency?: Currency;

  @Field({ nullable: true })
  paymentMethod?: string;
}

@InputType()
export class ExpenseItemInput {
  @Field({ description: 'Name of the item' })
  name: string;

  @Field(() => Int, { description: 'Price of a single unit item in 1/100 of the basic monetary unit' })
  price: number;

  @Field(() => Float, { description: 'Quantity of the item', nullable: true, defaultValue: 1 })
  qty: number;
}

@InputType()
export class AddExpenseInput {
  @Field({ description: 'Bill ID', nullable: true })
  bid?: string;

  @Field(() => ExpenseVisibiltyLevel, { description: 'Visibilty level of this expense', nullable: true })
  level: ExpenseVisibiltyLevel;

  @Field(() => Int, { description: 'Bill date in format YYMMDD' })
  date: number;

  @Field(() => Int, { description: 'Bill time in 24hr format HHMM', nullable: true })
  time?: number;

  @Field(() => ExpenseCategory, { description: 'Category to which this bill belongs to', nullable: true })
  category: ExpenseCategory;

  @Field({ description: 'Store from which the expense is made' })
  store: string;

  @Field({ description: 'Store location or branch name', nullable: true })
  storeLoc?: string;

  @Field({ description: 'Payment mode or method', nullable: true })
  paymentMethod?: string;

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
export class SearchExpensesArgs {
  @Field(() => ExpenseFilter, { nullable: true })
  filter?: ExpenseFilter;

  @Field(() => PageInput, { nullable: true })
  page: PageInput = { offset: 0, limit: 20 };

  @Field(() => SortOrder, { nullable: true })
  sortOrder: SortOrder = SortOrder.ASC;
}

@ArgsType()
export class GetExpenseArgs {
  @Field(() => ID)
  eid: string;
}

@ArgsType()
export class UpdateExpenseArgs extends GetExpenseArgs {
  @Field(() => UpdateExpenseInput)
  update: UpdateExpenseInput;
}
