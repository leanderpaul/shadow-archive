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
export class Food {
  /** Time when food taken */
  @Prop({
    type: 'number',
    required: [true, 'Food time is required'],
    min: [0, 'should be grater than 0 (00:00)'],
    max: [2359, 'should be less than 2359 (23:59)'],
  })
  time: number;

  /** Food items taken */
  @Prop({
    type: ['string'],
    required: true,
    minlength: [1, 'should have atleast 1 food item'],
  })
  items: string[];
}

export const FoodSchema = SchemaFactory.createForClass(Food);
