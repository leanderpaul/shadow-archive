/**
 * Importing npm packages
 */
import { type Type } from '@nestjs/common';
import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

export interface AddField<T> {
  date: number;
  input: T extends String ? string : T; // eslint-disable-line @typescript-eslint/ban-types
}

export interface UpdateField<T> {
  date: number;
  index: number;
  update: T extends String ? string : T; // eslint-disable-line @typescript-eslint/ban-types
}

/**
 * Declaring the constants
 */

export function addField<T>(classRef: Type<T>): Type<AddField<T>> {
  @ObjectType({ isAbstract: true })
  abstract class AddFieldType implements AddField<T> {
    @Field(() => Int)
    date: number;

    @Field(() => classRef)
    input: T extends String ? string : T; // eslint-disable-line @typescript-eslint/ban-types
  }

  return AddFieldType as Type<AddField<T>>;
}

export function updateField<T>(classRef: Type<T>): Type<UpdateField<T>> {
  @ObjectType({ isAbstract: true })
  abstract class UpdateFieldType implements UpdateField<T> {
    @Field(() => Int)
    date: number;

    @Field(() => Int)
    index: number;

    @Field(() => classRef)
    update: T extends String ? string : T; // eslint-disable-line @typescript-eslint/ban-types
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

@ArgsType()
export class SleepArgs extends addField(SleepInput) {}

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
export class AddStringArgs extends addField(String) {}

@ArgsType()
export class UpdateStringArgs extends updateField(String) {}
