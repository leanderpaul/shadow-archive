/**
 * Importing npm packages
 */
import { ArgsType, Int, Field, ObjectType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { SleepInput, AddActivityInput, AddExerciseInput, AddFoodInput, UpdateActivityInput, UpdateExerciseInput, UpdateFoodInput } from './memoir.inputs';

/**
 * Importing and defining types
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
