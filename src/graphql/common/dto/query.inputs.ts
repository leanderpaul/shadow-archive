/**
 * Importing npm packages
 */
import { Field, InputType, Int } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@InputType()
export class IntQuery {
  @Field(() => Int, { description: 'Minimum inclusive value to match', nullable: true })
  min: number;

  @Field(() => Int, { description: 'Maximum inclusive value to match', nullable: true })
  max: number;

  @Field(() => Int, { description: 'Exact value to match, this has more precedence than min and max', nullable: true })
  eq: number;
}
