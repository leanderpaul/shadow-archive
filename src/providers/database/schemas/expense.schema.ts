/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';

/**
 * Importing user defined packages
 */
import { defaultOptionsPlugin, transformId } from '../database.utils';

/**
 * Defining types
 */

export type ExpenseModel = Model<Expense>;

/**
 * Declaring the constants
 */
const nameRegex = /^[a-zA-Z0-9\-_ ]{1,32}$/;
const nameRegexMsg = 'should only contain alphanumberic, underscore and space characters';
const greaterThanZero = (num: number) => num > 0;
const greaterThanZeroMsg = 'should be greater than 0';

export enum Currency {
  GBP = 'GBP',
  INR = 'INR',
}

/**
 * Defining the schemas
 */

@Schema({
  _id: false,
  versionKey: false,
})
export class ExpenseItem {
  /** Name of the expense or bill item */
  @Prop({
    type: 'string',
    required: [true, 'Item name is required'],
    validate: [nameRegex, `Item name {VALUE} is invalid, ${nameRegex}`],
  })
  name: string;

  /** The price for which the item is sold for */
  @Prop({
    type: 'number',
    required: [true, 'Price is required'],
    validate: [greaterThanZero, `Price '{VALUE}' is invalid, ${greaterThanZeroMsg}`],
  })
  price: number;

  /** The quantity of the otem purchased, if this value is empty it means the quantity is one */
  @Prop({
    type: 'number',
    validate: [greaterThanZero, `Quantity '{VALUE}' is invalid, ${greaterThanZeroMsg}`],
    set: (val: number | null) => (val === 1 || val === null ? undefined : val),
  })
  qty?: number;
}

@Schema({ versionKey: false })
export class Expense {
  /** Expense ID, alias of _id  */
  eid: string;

  /** User ID to whom this expense is associated with' */
  @Prop({
    type: 'ObjectID',
    required: true,
  })
  uid: ObjectId;

  /** Bill ID that is mentioned in the bill or invoice */
  @Prop({
    type: 'string',
  })
  bid?: string;

  /** Name of the store from which this bill or invoice is issued */
  @Prop({
    type: 'string',
    required: [true, 'Store is required'],
    validate: [nameRegex, `Store '{VALUE}' is invalid, ${nameRegexMsg}`],
  })
  store: string;

  /** Store Location */
  @Prop({
    type: 'string',
    validate: [nameRegex, `Store Location '{VALUE}' is invalid, ${nameRegexMsg}`],
  })
  storeLoc?: string;

  /** The date on which the bill or invoice was issued */
  @Prop({
    type: 'number',
    required: [true, 'Date is required'],
    min: [230101, `should be greater than 230101 (2023-01-01)`],
    max: [991231, `should be less than 991231 (2099-12-31)`],
  })
  date: number;

  /** The time of the bill */
  @Prop({
    type: 'number',
    min: [0, 'should be grater than 0 (00:00)'],
    max: [2359, 'should be less than 2359 (23:59)'],
  })
  time?: number;

  /** The currency used to pay the bill */
  @Prop({
    type: 'string',
    required: [true, 'Currency is requried'],
    enum: {
      values: ['GBP', 'INR'],
      message: `Currency '{VALUE}' is invalid or not supported`,
    },
  })
  currency: Currency;

  /** payment method used to pay for this expense */
  @Prop({
    type: 'string',
    trim: true,
  })
  pm?: string;

  /** Description of the expense */
  @Prop({
    type: 'string',
    trim: true,
  })
  desc?: string;

  /** Array containing the items that are in the bill */
  @Prop({
    type: [SchemaFactory.createForClass(ExpenseItem)],
    required: true,
  })
  items: ExpenseItem[];

  /** Total amount of the expense sent. It is the sum of the price of all the items in the bill */
  @Prop({
    type: 'number',
    required: true,
  })
  total: number;
}

/**
 * Creating the mongoose Schema
 */
export const ExpenseSchema = SchemaFactory.createForClass(Expense);

/**
 * Setting up middlewares
 */
ExpenseSchema.virtual('eid').get(transformId);
ExpenseSchema.plugin(defaultOptionsPlugin);

/**
 * Setting up the indexes
 */
ExpenseSchema.index({ uid: 1, _id: 1 }, { name: 'UNIQUE_UID_AND_EID_INDEX', unique: true, background: true });

/**
 * Creating the mongoose module
 */
export const ExpenseMongooseModule = MongooseModule.forFeature([
  {
    name: Expense.name,
    schema: ExpenseSchema,
  },
]);
