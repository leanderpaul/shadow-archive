/**
 * Importing npm packages
 */
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

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
  @Field(() => Int, { description: 'Count of total number of expenses' })
  expenseCount: number;

  @Field(() => Float, { description: 'Difference between the total sum of real and fake expenses' })
  deviation: number;

  @Field(() => [ExpenseGroup], { defaultValue: [] })
  groups: ExpenseGroup[];

  @Field(() => [String], { description: 'Payment methods or modes used by the user' })
  paymentMethods: string[];
}
