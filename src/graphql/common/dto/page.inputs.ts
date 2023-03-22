/**
 * Importing npm packages
 */
import { InputType, Int, Field } from '@nestjs/graphql';
import { Min } from 'class-validator';

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@InputType()
export class PageInput {
  @Min(1, { message: 'should be a greater than 0' })
  @Field(() => Int, { defaultValue: 20, nullable: true })
  limit: number;

  @Min(0, { message: 'should be greater than or equal to 0' })
  @Field(() => Int, { defaultValue: 0, nullable: true })
  offset: number;
}
