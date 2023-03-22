/**
 * Importing npm packages
 */
import { ObjectType, Field, Int } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
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
  pms: string[];
}
