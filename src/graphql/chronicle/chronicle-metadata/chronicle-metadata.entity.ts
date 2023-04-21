/**
 * Importing npm packages
 */
import { ObjectType, Field, Int } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@ObjectType()
export class ExpenseGroup {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field(() => [String])
  words: string[];
}

@ObjectType()
export class Metadata {
  @Field(() => Int, { description: 'Count of total number of expenses', defaultValue: 0 })
  expenseCount: number;

  @Field(() => [ExpenseGroup], { defaultValue: [] })
  groups: ExpenseGroup[];

  @Field(() => [String], { description: 'Payment methods or modes used by the user', defaultValue: [] })
  paymentMethods: string[];
}
