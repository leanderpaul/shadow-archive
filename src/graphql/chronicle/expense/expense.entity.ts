/**
 * Importing npm packages
 */
import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { type Types } from 'mongoose';

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

export enum VisibilityLevel {
  STANDARD = 0,
  HIDDEN = 1,
  DISGUISE = -1,
}

registerEnumType(Currency, {
  name: 'Currency',
  description: 'Supported currencies',
});

registerEnumType(VisibilityLevel, {
  name: 'VisibilityLevel',
  description: 'The different visibility levels',
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
  eid: Types.ObjectId;

  @Field({ description: 'Bill ID', nullable: true })
  bid?: string;

  @Field(() => Int, { description: 'Date of the expense in the format YYMMDD' })
  date: number;

  @Field(() => VisibilityLevel, { description: 'Visibility level' })
  level: VisibilityLevel;

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

  @Field({ description: 'Description for this expense' })
  desc?: string;

  @Field(() => [ExpenseItem], { description: 'Array containing the items in the expense or bill' })
  items: ExpenseItem[];

  @Field(() => Float, { description: 'Total amount' })
  total: number;
}

@ObjectType()
export class ExpenseConnection extends Paginated(Expense) {}
