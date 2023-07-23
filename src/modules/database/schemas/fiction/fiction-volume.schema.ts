/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Schema({ _id: false })
export class FictionVolume {
  /** Volume name */
  @Prop({
    type: 'string',
    required: true,
  })
  name: string;

  /** Count of chapters in this volume. -1 denotes all the chapters */
  @Prop({
    type: 'number',
    required: true,
    min: -1,
    max: 5000,
  })
  chapterCount: number;
}

export const FictionVolumeSchema = SchemaFactory.createForClass(FictionVolume);
