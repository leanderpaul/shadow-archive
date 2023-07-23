/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Schema({ _id: false })
export class Workout {
  /** Type of workout */
  @Prop({
    type: 'string',
    required: [true, 'Workout type is requried'],
  })
  type: string;

  /** Number of sets done */
  @Prop({
    type: 'number',
    min: [1, 'should be greater than 0'],
  })
  sets?: number;

  /** Number of reps done, It is time in minutes if sets is not defined */
  @Prop({
    type: 'number',
    required: [true, 'Workout reps is required'],
    min: [1, 'should be greater than 0'],
  })
  reps: number;
}

@Schema({ _id: false })
export class Exercise {
  /** Time when started doing exercise */
  @Prop({
    type: 'number',
    required: [true, 'Workout time is required'],
    min: [0, 'should be greater than 0 (00:00)'],
    max: [2359, 'should be less than 2359 (23:59)'],
  })
  time: number;

  /** Duration of exercise */
  @Prop({
    type: 'number',
    min: [1, 'should be grater than 0'],
    max: [120, 'should be less than 120'],
  })
  duration: number;

  /** Carlories burnt */
  @Prop({
    type: 'number',
    min: [50, 'should be grater than 50'],
    max: [10000, 'should be less than 1000'],
  })
  calories: number;

  /** Workouts done */
  @Prop({
    type: [SchemaFactory.createForClass(Workout)],
    required: true,
    minlength: [1, 'should have atleast 1 workout record'],
  })
  workouts: Workout[];
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
