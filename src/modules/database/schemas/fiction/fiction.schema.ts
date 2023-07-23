/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Model, type Types } from 'mongoose';

/**
 * Importing user defined packages
 */
import { FictionGenre, FictionStatus, FictionTier, FictionType } from '@app/shared/constants';

import { formatContent } from './fiction-chapter.schema';
import { FictionSource, FictionSourceSchema } from './fiction-source.schema';
import { FictionVolume, FictionVolumeSchema } from './fiction-volume.schema';
import { defaultOptionsPlugin } from '../schema.utils';

/**
 * Defining types
 */

export type FictionModel = Model<Fiction>;

/**
 * Declaring the constants
 */

/**
 * @class contains details about the fiction
 */
@Schema({ versionKey: false, timestamps: { updatedAt: false } })
export class Fiction {
  /** Fiction ID, alias of _id */
  fid: Types.ObjectId;

  /** Title or Name of the fiction */
  @Prop({
    type: 'string',
    required: [true, 'required'],
    maxlength: 128,
  })
  name: string;

  /** Type of fiction */
  @Prop({
    type: 'number',
    enum: Object.values(FictionType).filter(v => typeof v === 'number'),
  })
  type: FictionType;

  /** The tier required to access this fiction */
  @Prop({
    type: 'number',
    required: true,
    default: FictionTier.PREMIUM,
    enum: Object.values(FictionTier).filter(v => typeof v === 'number'),
  })
  tier: FictionTier;

  /** Cover Image URL */
  @Prop({
    type: 'string',
    validate: [/^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i, 'should be a valid URI'],
  })
  coverUrl?: string;

  /** Genres of this fiction */
  @Prop({
    type: [{ type: Number, enum: Object.values(FictionGenre).filter(v => typeof v === 'number') }],
    required: true,
    validate: [(genres: FictionGenre[]) => genres.length > 0, 'should have atleast 1 genre'],
  })
  genres: FictionGenre[];

  /** Tags of this fiction */
  @Prop({
    type: ['string'],
    required: true,
    validate: [(tags: string[]) => tags.length > 0, 'should have atleast 1 tag'],
  })
  tags: string[];

  /** Authors of this fiction */
  @Prop({
    type: ['string'],
    required: true,
    validate: [(authors: string[]) => authors.length > 0, 'should have atleast 1 author'],
  })
  authors: string[];

  /** Year this fiction was published */
  @Prop({
    type: 'number',
    min: 1990,
    max: 2100,
  })
  publishYear?: number;

  /** Description or summary of this fiction */
  @Prop({
    type: 'string',
    required: [true, 'required'],
    minlength: [12, 'should have a minimum of 12 characters'],
    set: formatContent,
  })
  desc: string;

  /** Number of times this fiction is viewed */
  @Prop({
    type: 'number',
    required: true,
    default: 0,
  })
  views: number;

  /** Status of the fiction */
  @Prop({
    type: 'number',
    required: true,
    enum: Object.values(FictionStatus).filter(v => typeof v === 'number'),
    default: FictionStatus.ONGOING,
  })
  status: FictionStatus;

  /** Count of chapters in this fiction */
  @Prop({
    type: 'number',
    required: true,
    default: 0,
  })
  chapterCount: number;

  /** Volumes in this fiction */
  @Prop({
    type: [FictionVolumeSchema],
    default: void 0,
  })
  volumes?: FictionVolume[];

  @Prop({
    type: [FictionSourceSchema],
    default: void 0,
  })
  sources: FictionSource[];

  createdAt: Date;

  /** Date time when the new chapter was added to the fiction */
  @Prop({
    type: 'date',
    required: true,
    default: () => new Date(),
  })
  updatedAt: Date;
}

/**
 * Creating the mongoose Schema
 */
const FictionSchema = SchemaFactory.createForClass(Fiction);

/**
 * Setting up middlewares
 */
FictionSchema.alias('_id', 'fid');
FictionSchema.plugin(defaultOptionsPlugin);

/**
 * Setting up the indexes
 */
FictionSchema.index({ name: 1 }, { name: 'NAME', background: true });
FictionSchema.index({ genres: 1 }, { name: 'GENRES', background: true });
FictionSchema.index({ updatedAt: -1 }, { name: '-UPDATED_AT', background: true });

/**
 * Creating the mongoose module
 */
export const FictionMongooseModule = MongooseModule.forFeature([{ name: Fiction.name, schema: FictionSchema }]);
