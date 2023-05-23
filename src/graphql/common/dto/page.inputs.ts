/**
 * Importing npm packages
 */
import { Field, InputType, Int } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { ValidationError } from '@app/shared/errors';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@InputType()
export class PageInput {
  @Field(() => Int, { defaultValue: 20, nullable: true })
  limit: number;

  @Field(() => Int, { defaultValue: 0, nullable: true })
  offset: number;

  static isValid(input: PageInput): true {
    const error = new ValidationError();
    if (input.limit < 1) error.addFieldError('limit', 'should be greater than 0');
    if (input.offset < 0) error.addFieldError('offset', 'should be greater than or equal to 0');
    if (error.getErrorCount() > 0) throw error;
    return true;
  }
}
