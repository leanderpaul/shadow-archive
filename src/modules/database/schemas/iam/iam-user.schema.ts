/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { IAMRole } from '@app/shared/constants';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Schema({ _id: false })
export class IAMUser {
  @Prop({
    type: 'number',
    required: true,
    enum: Object.values(IAMRole).filter(v => typeof v === 'number'),
    default: IAMRole.USER,
  })
  role: IAMRole;
}

export const IAMUserSchema = SchemaFactory.createForClass(IAMUser);
