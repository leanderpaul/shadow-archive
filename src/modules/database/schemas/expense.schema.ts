/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Model, type Types } from 'mongoose';

/**
 * Importing user defined packages
 */
import { defaultOptionsPlugin } from '../database.utils';

/**
 * Defining types
 */

export type ExpenseModel = Model<Expense>;

/**
 * Declaring the constants
 */
const greaterThanZero = (num: number) => num > 0;
const greaterThanZeroMsg = 'should be greater than 0';

export enum Currency {
  INR = 1,
  GBP = 2,
}

export enum ExpenseCategory {
  UNKNOWN = 0,
  BILLS = 1,
  CHARITY = 2,
  EATING_OUT = 3,
  ENTERTAINMENT = 4,
  FAMILY = 5,
  GENERAL = 6,
  GROCERIES = 7,
  GIFTS = 8,
  HOLIDAYS = 9,
  PERSONAL_CARE = 10,
  SHOPPING = 11,
  TRANSPORT = 12,
}

export enum ExpenseVisibiltyLevel {
  STANDARD = 0,
  HIDDEN = 1,
  DISGUISE = -1,
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
    required: [true, 'required'],
    maxlength: 120,
  })
  name: string;

  /** The price for which the item is sold for */
  @Prop({
    type: 'number',
    required: [true, 'Price is required'],
    validate: [greaterThanZero, greaterThanZeroMsg],
  })
  price: number;

  /** The quantity of the otem purchased, if this value is empty it means the quantity is one */
  @Prop({
    type: 'number',
    validate: [greaterThanZero, greaterThanZeroMsg],
    set: (val: number | null) => (val === 1 || val === null ? undefined : val),
  })
  qty?: number;
}

@Schema({ versionKey: false })
export class Expense {
  /** Expense ID, alias of _id  */
  eid: Types.ObjectId;

  /** User ID to whom this expense is associated with' */
  @Prop({
    type: 'ObjectID',
    required: true,
  })
  uid: Types.ObjectId;

  /** Bill ID that is mentioned in the bill or invoice */
  @Prop({
    type: 'string',
  })
  bid?: string;

  /** Secrecy level. 0 - can be viewed by all, 1 - actual expense, -1 - fake expense to cover level 1 expense  */
  @Prop({
    type: 'number',
    required: true,
    default: ExpenseVisibiltyLevel.STANDARD,
    enum: {
      values: Object.values(ExpenseVisibiltyLevel),
      message: 'unsupported visibilty level',
    },
  })
  level: ExpenseVisibiltyLevel;

  @Prop({
    type: 'number',
    required: true,
    default: ExpenseCategory.UNKNOWN,
    enum: {
      values: Object.values(ExpenseCategory),
      message: 'unsupported category',
    },
  })
  category: ExpenseCategory;

  /** Name of the store from which this bill or invoice is issued */
  @Prop({
    type: 'string',
    required: [true, 'Store is required'],
    maxlength: 48,
  })
  store: string;

  /** Store Location */
  @Prop({
    type: 'string',
    maxlength: 48,
  })
  storeLoc?: string;

  /** The date on which the bill or invoice was issued */
  @Prop({
    type: 'number',
    required: [true, 'Date is required'],
    min: [220101, `should be greater than 220101 (2022-01-01)`],
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
    type: 'number',
    required: [true, 'Currency is requried'],
    enum: {
      values: Object.values(Currency),
      message: `unsupported value provided`,
    },
  })
  currency: Currency;

  /** payment method used to pay for this expense */
  @Prop({
    type: 'string',
    trim: true,
  })
  paymentMethod?: string;

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
ExpenseSchema.alias('_id', 'eid');
ExpenseSchema.plugin(defaultOptionsPlugin);

/**
 * Setting up the indexes
 */
ExpenseSchema.index({ uid: 1, date: 1, currency: 1, level: 1 }, { name: 'UID_DATE_CURRENCY_LEVEL', background: true });

/**
 * Creating the mongoose module
 */
export const ExpenseMongooseModule = MongooseModule.forFeature([
  {
    name: Expense.name,
    schema: ExpenseSchema,
  },
]);
