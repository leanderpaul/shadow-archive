/**
 * Importing npm packages
 */
import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { addField, updateField } from './common.args';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@InputType()
export class AddFoodInput {
  @Field({ description: 'Start time of eating in 24 hr format HHMM' })
  time: string;

  @Field(() => [String], { description: 'Items in the menu' })
  items: string[];
}

@InputType()
export class UpdateFoodInput extends PartialType(AddFoodInput) {}

@ArgsType()
export class AddFoodArgs extends addField(AddFoodInput) {}

@ArgsType()
export class UpdateFoodArgs extends updateField(UpdateFoodInput) {}
