/**
 * Importing npm packages
 */
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { ActivityType } from '@app/providers/database';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

registerEnumType(ActivityType, { name: 'ActivityType' });

@ObjectType()
export class Sleep {
  @Field(() => Int, { nullable: true, description: 'Wakeup time in 24 hr format HHMM' })
  wakeup?: number;

  @Field(() => Int, { nullable: true, description: 'Bedtime in 24 hr format HHMM' })
  bedtime?: number;

  @Field(() => Int, { nullable: true, description: 'Time slept in minutes' })
  duration?: number;
}

@ObjectType()
export class Workout {
  @Field({ description: 'Type of workout. For Eg planks, pull ups, etc' })
  type: string;

  @Field(() => Int, { nullable: true, description: 'Number of sets done' })
  sets?: number;

  @Field(() => Int, { description: 'Number of reps. If sets is not defined then this field denotes duration in minutes' })
  reps: number;
}

@ObjectType()
export class Exercise {
  @Field(() => Int, { description: 'Start time of excercise in 24 hr format HHMM' })
  time: number;

  @Field(() => Int, { description: 'Duration excercised in minutes' })
  duration: number;

  @Field(() => Int, { description: 'Calories burnt' })
  calories: number;

  @Field(() => [Workout], { description: 'List of workouts done' })
  workouts: Workout[];
}

@ObjectType()
export class Food {
  @Field({ description: 'Start time of eating in 24 hr format HHMM' })
  time: string;

  @Field(() => [String], { description: 'Items in the menu' })
  items: string[];
}

@ObjectType()
export class Activity {
  @Field(() => ActivityType, { description: 'Type of activity done' })
  type: ActivityType;

  @Field({ description: 'Name of the activity. Anwers "what `<Activity type>`"?' })
  name: string;

  @Field(() => Int, { description: 'Duration spent doing the activity in minutes' })
  duration: number;

  @Field(() => [String], { nullable: true, description: 'Description or details of the activity' })
  description?: string[];
}

@ObjectType()
export class Memoir {
  @Field(() => Int, { description: 'Date when this record is for. Date format is YYMMDD' })
  date: number;

  @Field(() => Sleep, { nullable: true })
  sleep?: Sleep;

  @Field(() => [Exercise], { description: 'Excercises done on this day', defaultValue: [] })
  excercises: Exercise[];

  @Field(() => [Activity], { description: 'Activities done on this day', defaultValue: [] })
  activities: Activity[];

  @Field(() => [Food], { description: 'Food ate this day', defaultValue: [] })
  foods: Food[];

  @Field(() => [String], { description: 'Diary reords of this day', defaultValue: [] })
  diary: string[];

  @Field(() => [String], { description: 'Events to be noted such as laundry, bedsheet change, etc', defaultValue: [] })
  events: string[];
}
