/**
 * Importing npm packages
 */
import { InputType, Field, Int, OmitType, PartialType, InterfaceType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { ActivityType } from '@app/providers';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@InputType()
export class SleepInput {
  @Field(() => Int, { nullable: true, description: 'Wakeup time in 24 hr format HHMM' })
  wakeup?: number;

  @Field(() => Int, { nullable: true, description: 'Bedtime in 24 hr format HHMM' })
  bedtime?: number;
}

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

@InputType()
export class AddActivityInput {
  @Field(() => ActivityType, { description: 'Type of activity done' })
  type: ActivityType;

  @Field({ description: 'Name of the activity. Anwers "what `<Activity type>`"?' })
  name: string;

  @Field(() => Int, { description: 'Duration spent doing the activity in minutes' })
  duration: number;

  @Field(() => [String], { nullable: true, description: 'Description or details of the activity' })
  description?: string[];
}

@InputType()
export class UpdateActivityInput extends PartialType(AddActivityInput) {}

@InputType()
export class AddFoodInput {
  @Field({ description: 'Start time of eating in 24 hr format HHMM' })
  time: string;

  @Field(() => [String], { description: 'Items in the menu' })
  items: string[];
}

@InputType()
export class UpdateFoodInput extends PartialType(AddFoodInput) {}
