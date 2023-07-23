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
export class Sleep {
  /** Wakeup time */
  @Prop({
    type: 'number',
    min: [0, 'should be grater than 0 (00:00)'],
    max: [2359, 'should be less than 2359 (23:59)'],
  })
  wakeup?: number;

  /** Sleep time */
  @Prop({
    type: 'number',
    min: [0, 'should be grater than 0 (00:00)'],
    max: [2359, 'should be less than 2359 (23:59)'],
  })
  bedtime?: number;

  /** Duration of sleep */
  @Prop({
    type: 'number',
    min: [30, 'should be grater than 30'],
    max: [1000, 'should be less than 1000'],
  })
  duration?: number;
}

export const SleepSchema = SchemaFactory.createForClass(Sleep);
