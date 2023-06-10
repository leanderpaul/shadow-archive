/**
 * Importing npm packages
 */
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { ExpenseCategory } from '@app/modules/database';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@ObjectType()
export class ExpenseInsight {
  @Field(() => Float)
  total: number;

  @Field(() => Int)
  billCount: number;

  @Field(() => [ExpenseCategoryInsight])
  categories: ExpenseCategoryInsight[];
}

@ObjectType()
export class ExpenseCategoryInsight {
  @Field(() => ExpenseCategory)
  category: ExpenseCategory;

  @Field(() => Float)
  total: number;

  @Field(() => Int)
  billCount: number;
}

@ObjectType()
export class Insight {
  @Field(() => ExpenseInsight)
  expense: ExpenseInsight;
}
