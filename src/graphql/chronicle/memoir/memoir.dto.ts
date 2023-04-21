/**
 * Importing npm packages
 */
import { ArgsType, Int, Field, ObjectType, InputType, PartialType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { ActivityType } from '@app/providers/database';

/**
 * Defining types
 */
import type { Type } from '@nestjs/common';

interface AddField<T> {
  date: number;
  input: T;
}

interface UpdateField<T> {
  date: number;
  index: number;
  update: T;
}

/**
 * Declaring the constants
 */

function addField<T>(classRef: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class AddFieldType implements AddField<T> {
    @Field(() => Int)
    date: number;

    @Field(() => classRef)
    input: T;
  }

  return AddFieldType as Type<AddField<T>>;
}

function updateField<T>(classRef: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class UpdateFieldType implements UpdateField<T> {
    @Field(() => Int)
    date: number;

    @Field(() => Int)
    index: number;

    @Field(() => classRef)
    update: T;
  }

  return UpdateFieldType as Type<UpdateField<T>>;
}

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

@ArgsType()
export class GetMemoirArgs {
  @Field(() => Int)
  date: number;
}

@ArgsType()
export class DeleteArgs {
  @Field(() => Int)
  date: number;

  @Field(() => Int)
  index: number;
}

@ArgsType()
export class SleepArgs extends addField(SleepInput) {}

@ArgsType()
export class AddActivityArgs extends addField(AddActivityInput) {}

@ArgsType()
export class UpdateActivityArgs extends updateField(UpdateActivityInput) {}

@ArgsType()
export class AddFoodArgs extends addField(AddFoodInput) {}

@ArgsType()
export class UpdateFoodArgs extends updateField(UpdateFoodInput) {}

@ArgsType()
export class AddExerciseArgs extends addField(AddExerciseInput) {}

@ArgsType()
export class UpdateExerciseArgs extends updateField(UpdateExerciseInput) {}

@ArgsType()
export class AddStringArgs extends addField(String) {}

@ArgsType()
export class UpdateStringArgs extends updateField(String) {}
