/**
 * Importing npm packages
 */
import { Field, Float, ObjectType } from '@nestjs/graphql';

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
export class Metadata {
  @Field(() => Float, { description: 'Difference between the total sum of real and fake expenses' })
  deviation: number;

  @Field(() => [String], { description: 'Payment methods or modes used by the user' })
  paymentMethods: string[];
}
