/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { ActivityType } from '@app/shared/constants';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Schema({ _id: false })
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

export const ActivitySchema = SchemaFactory.createForClass(Activity);
