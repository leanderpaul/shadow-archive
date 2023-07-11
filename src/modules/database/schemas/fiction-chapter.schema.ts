/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Model, type Types } from 'mongoose';
import sanitizeHtml from 'sanitize-html';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';

import { defaultOptionsPlugin, handleDuplicateKeyError } from '../database.utils';

/**
 * Defining types
 */

export type FictionChapterModel = Model<FictionChapter>;

/**
 * Declaring the constants
 */

export function formatContent(content: string): string {
  content = content.trim().replace(/[“”]/g, '"').replace(/[’]/g, "'");
  if (content.search(/<[a-zA-Z]+>/g) === -1) content = content.replace(/\n/g, '<br>');
  return sanitizeHtml(content, { allowedTags: ['br', 'p', 'div', 'em', 'strong', 'span'], allowedAttributes: false });
}

/**
 * @class contains the contents of the fiction chapter
 */
@Schema({ versionKey: false, timestamps: { updatedAt: false } })
export class FictionChapter {
  /** Fiction ID to which this chapter belongs to */
  @Prop({
    type: 'ObjectID',
    required: true,
  })
  fid: Types.ObjectId;

  /** Chapter number or index */
  @Prop({
    type: 'number',
    required: true,
    min: 1,
    max: 5000,
  })
  index: number;

  /** Name of the chapter */
  @Prop({
    type: 'string',
  })
  name?: string;

  /** Denotes whether this chapter has any R-18 content */
  @Prop({
    type: 'boolean',
  })
  matureContent?: boolean;

  /** Contents of the chapter */
  @Prop({
    type: 'string',
    minlength: [300, 'should have a minimum of 300 characters'],
    required: [true, 'requried'],
    set: formatContent,
  })
  content: string;

  createdAt: Date;
}

/**
 * Creating the mongoose Schema
 */
const FictionChapterSchema = SchemaFactory.createForClass(FictionChapter);

/**
 * Setting up middlewares
 */
FictionChapterSchema.plugin(defaultOptionsPlugin);
FictionChapterSchema.post('save', handleDuplicateKeyError(new AppError(ErrorCode.F003)));

/**
 * Setting up the indexes
 */
FictionChapterSchema.index({ fid: 1, index: 1 }, { name: 'UNIQUE_FID_INDEX', unique: true, background: true });

/**
 * Creating the mongoose module
 */
export const FictionChapterMongooseModule = MongooseModule.forFeature([{ name: FictionChapter.name, schema: FictionChapterSchema }]);
