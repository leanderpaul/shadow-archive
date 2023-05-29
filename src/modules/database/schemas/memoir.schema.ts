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

export type MemoirModel = Model<Memoir>;

export enum ActivityType {
  ANIME = 'ANIME',
  CODING = 'CODING',
  MOVIE = 'MOVIE',
  VIDEO = 'VIDEO',
  WEBNOVEL = 'WEBNOVEL',
}

/**
 * Declaring the constants
 */

/**
 * Defining the schemas
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

export class Activity {
  /** Activity type */
  @Prop({
    type: 'string',
    enum: {
      values: Object.values(ActivityType),
      message: `Activity type '{VALUE}' is invalid`,
    },
    required: [true, 'Activity type is required'],
  })
  type: ActivityType;

  /** anwer to what `<Activity type>`? */
  @Prop({
    type: 'string',
    required: [true, 'Activity name is required'],
    minlength: [3, 'should have more than 2 characters'],
  })
  name: string;

  /** Duration of the activity */
  @Prop({
    type: 'number',
    required: [true, 'Activity duration is required'],
    miin: 10,
  })
  duration: number;

  /** Description or details about the activity */
  @Prop({
    type: ['string'],
    default: undefined,
  })
  desc?: string[];
}

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

  @Prop({
    type: SchemaFactory.createForClass(Sleep),
  })
  sleep?: Sleep;

  @Prop({
    type: [SchemaFactory.createForClass(Exercise)],
    default: undefined,
  })
  exercises?: Exercise[];

  @Prop({
    type: [SchemaFactory.createForClass(Activity)],
    default: undefined,
  })
  activities?: Activity[];

  @Prop({
    type: [SchemaFactory.createForClass(Food)],
    default: undefined,
  })
  foods?: Food[];

  /** Dairy entry for the day */
  @Prop({
    type: ['string'],
    default: undefined,
  })
  diary?: string[];

  /** Records to be noted such as changing bedsheet or doing laundry */
  @Prop({
    type: ['string'],
    default: undefined,
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
