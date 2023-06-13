/**
 * Importing npm packages
 */
import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { type Types } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Paginated } from '@app/graphql/common';
import { Currency, ExpenseCategory, ExpenseVisibiltyLevel } from '@app/modules/database';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

registerEnumType(Currency, {
  name: 'Currency',
  description: 'Supported currencies',
});

registerEnumType(ExpenseVisibiltyLevel, {
  name: 'ExpenseVisibiltyLevel',
  description: 'The different visibility levels',
});

registerEnumType(ExpenseCategory, {
  name: 'ExpenseCategory',
  description: 'Supported expense categories',
});

@ObjectType()
export class ExpenseItem {
  @Field({ description: 'Name of the item' })
  name: string;

  @Field(() => Int, { description: 'Price of a unit item in 1/100 of the basic monetary unit, Eg: $ 1.50  = 150' })
  price: number;

  @Field(() => Float, { description: 'Quantity of the item', defaultValue: 1 })
  qty?: number;
}

@ObjectType()
export class Expense {
  @Field(() => ID, { description: 'Expense ID' })
  eid: Types.ObjectId;

  @Field({ description: 'Bill ID', nullable: true })
  bid?: string;

  @Field(() => Int, { description: 'Date of the expense in the format YYMMDD' })
  date: number;

  @Field(() => ExpenseVisibiltyLevel, { description: 'Visibility level' })
  level: ExpenseVisibiltyLevel;

  @Field(() => ExpenseCategory, { description: 'Expense category' })
  category: ExpenseCategory;

  @Field(() => Int, { description: 'Time of the bill in the 24 hour format HHMM', nullable: true })
  time?: number;

  @Field({ description: 'Store name' })
  store: string;

  @Field({ description: 'Store Location or branch name', nullable: true })
  storeLoc?: string;

  @Field(() => Currency, { description: 'Currency of the bill' })
  currency: Currency;

  @Field({ description: 'Payment mode or method', nullable: true })
  paymentMethod?: string;

  @Field({ description: 'Description for this expense', nullable: true })
  desc?: string;

  @Field(() => [ExpenseItem], { description: 'Array containing the items in the expense or bill' })
  items: ExpenseItem[];

  @Field(() => Int, { description: 'Total amount in 1/100 of the basic monetary unit' })
  total: number;
}

@ObjectType()
export class ExpenseConnection extends Paginated(Expense) {}
