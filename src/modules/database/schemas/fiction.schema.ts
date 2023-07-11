/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Model, type Types } from 'mongoose';

/**
 * Importing user defined packages
 */
import { formatContent } from './fiction-chapter.schema';
import { defaultOptionsPlugin } from '../database.utils';

/**
 * Defining types
 */

export enum FictionType {
  WEBNOVEL = 1,
  FANFICTION = 2,
  ORIGINAL = 3,
}

export enum FictionGenre {
  ACTION = 1,
  ADULT = 2,
  ADVENTURE = 3,
  COMEDY = 4,
  DRAMA = 5,
  ECCHI = 6,
  FANTASY = 7,
  GENDER_BENDER = 8,
  HAREM = 9,
  HISTORICAL = 10,
  HORROR = 11,
  JOSEI = 12,
  MARTIAL_ARTS = 13,
  MATURE = 14,
  MECHA = 15,
  MYSTERY = 16,
  PSYCHOLOGICAL = 17,
  ROMANCE = 18,
  SCHOOL_LIFE = 19,
  SCI_FI = 20,
  SEINEN = 21,
  SHOUJO = 22,
  SHOUJO_AI = 23,
  SHOUNEN = 24,
  SHOUNEN_AI = 25,
  SLICE_OF_LIFE = 26,
  SMUT = 27,
  SPORTS = 28,
  SUPERNATURAL = 29,
  TRAGEDY = 30,
  WUXIA = 31,
  XIANXIA = 32,
  XUANHUAN = 33,
  YAOI = 34,
  YURI = 35,
}

export enum FictionStatus {
  COMPLETED = 1,
  ONGOING = 2,
  HIATUS = 3,
}

export enum FictionWebsite {
  WEBNOVEL = 0,
  BOXNOVEL = 1,
  NOVELFULL = 2,
  PATREON = 3,
}

export enum FictionTier {
  FREE = 1,
  PREMIUM = 2,
  PRIVATE = 3,
}

export type FictionModel = Model<Fiction>;

/**
 * Declaring the constants
 */

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
    type: [SchemaFactory.createForClass(FictionVolume)],
    default: void 0,
  })
  volumes?: FictionVolume[];

  @Prop({
    type: [SchemaFactory.createForClass(FictionSource)],
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
