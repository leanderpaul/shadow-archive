/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Model, type Types } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Activity, ActivitySchema } from './memoir-activity.schema';
import { Exercise, ExerciseSchema } from './memoir-exercise.schema';
import { Food, FoodSchema } from './memoir-food.schema';
import { Sleep, SleepSchema } from './memoir-sleep.schema';
import { defaultOptionsPlugin } from '../schema.utils';

/**
 * Defining types
 */

export type MemoirModel = Model<Memoir>;

/**
 * Declaring the constants
 */

/**
 * Defining the schemas
 */

@Schema({ versionKey: false })
export class Memoir {
  /** User ID to whom this memoir is associated with' */
  @Prop({
    type: 'ObjectID',
    required: true,
  })
  uid: Types.ObjectId;

  /** The date on which this entry is for */
  @Prop({
    type: 'number',
    required: [true, 'Date is required'],
    min: [230101, `should be greater than 230101 (2023-01-01)`],
    max: [991231, `should be less than 991231 (2099-12-31)`],
  })
  date: number;

  @Prop({ type: SleepSchema })
  sleep?: Sleep;

  @Prop({
    type: [ExerciseSchema],
    default: void 0,
  })
  exercises?: Exercise[];

  @Prop({
    type: [ActivitySchema],
    default: void 0,
  })
  activities?: Activity[];

  @Prop({
    type: [FoodSchema],
    default: void 0,
  })
  foods?: Food[];

  /** Dairy entry for the day */
  @Prop({
    type: ['string'],
    default: void 0,
  })
  diary?: string[];

  /** Records to be noted such as changing bedsheet or doing laundry */
  @Prop({
    type: ['string'],
    default: void 0,
  })
  events?: string[];
}

/**
 * Creating the mongoose Schema
 */
const MemoirSchema = SchemaFactory.createForClass(Memoir);

/**
 * Setting up middlewares
 */
MemoirSchema.plugin(defaultOptionsPlugin);

/**
 * Setting up the indexes
 */
MemoirSchema.index({ uid: 1, date: 1 }, { name: 'UNIQUE_UID_DATE', unique: true, background: true });

/**
 * Creating the mongoose module
 */
export const MemoirMongooseModule = MongooseModule.forFeature([
  {
    name: Memoir.name,
    schema: MemoirSchema,
  },
]);
