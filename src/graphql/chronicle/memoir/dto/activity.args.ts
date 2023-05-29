/**
 * Importing npm packages
 */
import { ArgsType, Field, InputType, Int, PartialType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { ActivityType } from '@app/modules/database';

import { addField, updateField } from './common.args';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@InputType()
export class AddActivityInput {
  @Field(() => ActivityType, { description: 'Type of activity done' })
  type: ActivityType;

  @Field({ description: 'Name of the activity. Anwers "what `<Activity type>`"?' })
  name: string;

  @Field(() => Int, { description: 'Duration spent doing the activity in minutes' })
  duration: number;

  @Field(() => [String], { nullable: true, description: 'Description or details of the activity' })
  desc?: string[];
}

@InputType()
export class UpdateActivityInput extends PartialType(AddActivityInput) {}

@ArgsType()
export class AddActivityArgs extends addField(AddActivityInput) {}

@ArgsType()
export class UpdateActivityArgs extends updateField(UpdateActivityInput) {}
