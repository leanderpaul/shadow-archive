/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { ArchiveRole } from '@app/shared/constants';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Schema({ _id: false })
export class ArchiveUser {
  @Prop({
    type: 'number',
    required: true,
    enum: Object.values(ArchiveRole).filter(v => typeof v === 'number'),
    default: ArchiveRole.NONE,
  })
  role: ArchiveRole;
}

export const ArchiveUserSchema = SchemaFactory.createForClass(ArchiveUser);
