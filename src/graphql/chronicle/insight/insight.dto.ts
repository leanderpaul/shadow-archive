/**
 * Importing npm packages
 */
import { ArgsType, Field, Int } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { Currency, ExpenseVisibiltyLevel } from '@app/modules/database';
import { ValidationError } from '@app/shared/errors';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@ArgsType()
export class InsightFilter {
  @Field(() => Int, { description: "Year in the form 'YY'. Example: 23" })
  year: number;

  @Field(() => Int, { description: 'Week, starts from 1', nullable: true })
  week?: number;

  @Field(() => Int, { description: 'Month, starts from 1 for January', nullable: true })
  month?: number;

  static validate(input: InsightFilter): true {
    const error = new ValidationError();
    if (input.year >= 100 || input.year <= 20) error.addFieldError('year', 'should be between 20 and 99');
    if (input.week != null && (input.week > 52 || input.week <= 0)) error.addFieldError('week', 'should be between 1 and 52');
    if (input.month != null && (input.month > 12 || input.month <= 0)) error.addFieldError('month', 'should be between 1 and 12');
    if (error.getErrorCount() > 0) throw error;
    return true;
  }
}

@ArgsType()
export class ExpenseInsightFilter {
  @Field(() => Currency)
  currency: Currency;

  @Field(() => ExpenseVisibiltyLevel, { nullable: true })
  level?: number;
}
