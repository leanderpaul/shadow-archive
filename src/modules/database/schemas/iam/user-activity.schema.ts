/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { UserActivityType } from '@app/shared/constants';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Schema({ _id: false })
export class UserActivity {
  @Prop({
    type: 'number',
    required: true,
    enum: Object.values(UserActivityType).filter(v => typeof v === 'number'),
  })
  type: UserActivityType;

  @Prop({
    type: 'date',
    default: () => new Date(),
  })
  time: Date;
}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
