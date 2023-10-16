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

@Schema({
  _id: false,
  versionKey: false,
})
export class ExpenseItem {
  /** Name of the expense or bill item */
  @Prop({
    type: 'string',
    required: [true, 'required'],
    maxlength: 120,
  })
  name: string;

  /** The price for which the item is sold for */
  @Prop({
    type: 'number',
    required: [true, 'Price is required'],
    validate: [(value: number) => value % 1 === 0 && value !== 0, 'should be an integer greater than or less 0'],
  })
  price: number;

  /** The quantity of the otem purchased, if this value is empty it means the quantity is one */
  @Prop({
    type: 'number',
    validate: [(value: number) => value > 0, 'should be greater than 0'],
    set: (val: number | null) => (val === 1 || val === null ? undefined : val),
  })
  qty?: number;
}

export const ExpenseItemSchema = SchemaFactory.createForClass(ExpenseItem);
