/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { FictionWebsite } from '@app/shared/constants';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Schema({ _id: false })
export class FictionSource {
  /** Source fiction ID */
  @Prop({
    type: 'string',
    required: true,
  })
  sfid: string;

  /** Source website */
  @Prop({
    type: 'number',
    enum: Object.values(FictionWebsite).filter(v => typeof v === 'number'),
    required: true,
  })
  website: FictionWebsite;

  /** Queries required to access the source fiction */
  @Prop({
    type: 'string',
    minlength: 3,
  })
  query?: string;
}

export const FictionSourceSchema = SchemaFactory.createForClass(FictionSource);
