/**
 * Importing npm packages
 */
import { ArgsType, Field, InputType, Int, PartialType } from '@nestjs/graphql';

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
export class WorkoutInput {
  @Field({ description: 'Type of workout. For Eg planks, pull ups, etc' })
  type: string;

  @Field(() => Int, { nullable: true, description: 'Number of sets done' })
  sets?: number;

  @Field(() => Int, { description: 'Number of reps. If sets is not defined then this field denotes duration in minutes' })
  reps: number;
}

@InputType()
export class AddExerciseInput {
  @Field(() => Int, { description: 'Start time of excercise in 24 hr format HHMM' })
  time: number;

  @Field(() => Int, { description: 'Duration excercised in minutes' })
  duration: number;

  @Field(() => Int, { description: 'Calories burnt' })
  calories: number;

  @Field(() => [WorkoutInput])
  workouts: WorkoutInput[];
}

@InputType()
export class UpdateExerciseInput extends PartialType(AddExerciseInput) {}

@ArgsType()
export class AddExerciseArgs extends addField(AddExerciseInput) {}

@ArgsType()
export class UpdateExerciseArgs extends updateField(UpdateExerciseInput) {}
