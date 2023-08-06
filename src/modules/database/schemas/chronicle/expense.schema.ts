/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, type Model, type Query, type Types } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Currency, ExpenseCategory, ExpenseVisibiltyLevel } from '@app/shared/constants';

import { ExpenseItem, ExpenseItemSchema } from './expense-item.schema';
import { defaultOptionsPlugin } from '../schema.utils';

/**
 * Defining types
 */

export type ExpenseModel = Model<Expense>;

/**
 * Declaring the constants
 */
const calculateTotal = (items: ExpenseItem[]): number => items.reduce((total, item) => total + Math.round(item.price * (item.qty ?? 1)), 0);

/**
 * Defining the schemas
 */

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
    enum: Object.values(ExpenseVisibiltyLevel).filter(v => typeof v === 'number'),
  })
  level: ExpenseVisibiltyLevel;

  @Prop({
    type: 'number',
    required: true,
    default: ExpenseCategory.UNKNOWN,
    enum: Object.values(ExpenseCategory).filter(v => typeof v === 'number'),
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
    enum: Object.values(Currency).filter(v => typeof v === 'number'),
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
    type: [ExpenseItemSchema],
    required: true,
  })
  items: ExpenseItem[];

  /** Total amount of the expense sent. It is the sum of the price of all the items in the bill */
  @Prop({
    type: 'number',
    required: [true, 'required'],
    default: (obj: Expense) => calculateTotal(obj.items),
    validate: {
      msg: 'should be an integer greater than 0 and be equal to the sum of the price of all the items',
      validator: function (this: Document<Expense> | Query<unknown, Expense>, total: number) {
        const items: ExpenseItem[] = this.get('items');
        if (!items) return false;
        const actualTotal = calculateTotal(items);
        return total === actualTotal;
      },
    },
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
