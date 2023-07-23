/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { FictionRole } from '@app/shared/constants';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Schema({ _id: false })
export class FictionUser {
  @Prop({
    type: 'number',
    required: true,
    enum: Object.values(FictionRole).filter(v => typeof v === 'number'),
    default: FictionRole.READER,
  })
  role: FictionRole;
}

export const FictionUserSchema = SchemaFactory.createForClass(FictionUser);
