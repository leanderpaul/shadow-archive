/**
 * Importing npm packages
 */
import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { Paginated } from '@app/graphql/common';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export enum Currency {
  GBP = 'GBP',
  INR = 'INR',
}

registerEnumType(Currency, {
  name: 'Currency',
  description: 'Supported currencies',
});

@ObjectType({})
export class ExpenseItem {
  @Field({ description: 'Name of the item' })
  name: string;

  @Field(() => Float, { description: 'Price of a unit item' })
  price: number;

  @Field(() => Float, { description: 'Quantity of the item', defaultValue: 1 })
  qty?: number;
}

@ObjectType({})
export class Expense {
  @Field(() => ID, { description: 'Expense ID' })
  eid: string;

  @Field({ description: 'Bill ID', nullable: true })
  bid?: string;

  @Field(() => Int, { description: 'Date of the expense in the format YYMMDD' })
  date: number;

  @Field(() => Int, { description: 'Time of the bill in the 24 hour format HHMM', nullable: true })
  time?: number;

  @Field({ description: 'Store name' })
  store: string;

  @Field({ description: 'Store Location or branch name', nullable: true })
  storeLoc?: string;

  @Field(() => Currency, { description: 'Currency of the bill' })
  currency: Currency;

  @Field({ description: 'Payment mode or method', nullable: true })
  pm?: string;

  @Field({ description: 'Description for this expense' })
  desc?: string;

  @Field(() => [ExpenseItem], { description: 'Array containing the items in the expense or bill' })
  items: ExpenseItem[];

  @Field(() => Float, { description: 'Total amount' })
  total: number;
}

@ObjectType()
export class ExpenseConnection extends Paginated(Expense) {}
