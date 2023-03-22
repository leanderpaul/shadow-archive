/**
 * Importing npm packages
 */
import { Field, ObjectType } from '@nestjs/graphql';

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
export class FieldError {
  @Field()
  field: string;

  @Field()
  msg: string;
}

@ObjectType()
export class Error {
  @Field({ description: 'Error Code' })
  code: string;

  @Field({ description: 'Error message' })
  msg: string;

  @Field(() => [FieldError], { description: 'Fields that failed validation', nullable: true })
  fields?: FieldError[];
}
