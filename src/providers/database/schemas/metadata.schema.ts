/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type ObjectId } from 'mongodb';
import { type Model } from 'mongoose';

/**
 * Importing user defined packages
 */
import { defaultOptionsPlugin } from '../database.utils';

/**
 * Defining types
 */

export type MetadataModel = Model<Metadata>;

export type ChronicleMetadataModel = Model<ChronicleMetadata>;

/**
 * Declaring the constants
 */
const nameRegex = /^[a-zA-Z0-9\-_ ]{3,32}$/;

/**
 * Defining the schemas
 */

@Schema({ versionKey: false, discriminatorKey: 'service' })
export class Metadata {
  /** User ID to whom this expense is associated with */
  @Prop({
    type: 'ObjectID',
    required: true,
  })
  uid: ObjectId;

  /** The discriminator key used to determine the service to which this metadata belongs to */
  service: 'chronicle';
}

@Schema({ _id: false })
export class ExpenseGroup {
  /** Expense group ID */
  @Prop({
    type: 'number',
    required: true,
    min: 1,
  })
  id: number;

  @Prop({
    type: 'string',
    required: [true, 'Expense group name is required'],
    validate: [nameRegex, `Expense group name '{VALUE}' is invalid`],
  })
  /** Name of the expense group */
  name: string;

  @Prop({
    type: ['string'],
    required: true,
    match: [nameRegex, `Expense group word '{VALUE}' is invalid`],
    // validate: [(w: string[]) => w.some((w) => !nameRegex.test(w)), `Expense group words have some invalid values`],
  })
  /** Words to include in expense group */
  words: string[];
}

@Schema({})
export class ChronicleMetadata extends Metadata {
  /** The total count of the expenses or bills that the user has added */
  @Prop({
    type: 'number',
    required: true,
    default: 0,
    min: 0,
  })
  expenseCount: number;

  /** Array containg payment methods associated with the user */
  @Prop({
    type: ['string'],
    required: true,
    match: [nameRegex, `Payment Method '{VALUE}' is invalid`],
  })
  pms: string[];

  /** Array containg the expense groups associated with the user */
  @Prop({
    type: [SchemaFactory.createForClass(ExpenseGroup)],
    requried: true,
  })
  groups: ExpenseGroup[];
}

/**
 * Creating the mongoose Schema
 */
export const MetadataSchema = SchemaFactory.createForClass(Metadata);
export const ChronicleMetadataSchema = SchemaFactory.createForClass(ChronicleMetadata);

/**
 * Setting up middlewares
 */
MetadataSchema.plugin(defaultOptionsPlugin);

/**
 * Setting up the indexes
 */
MetadataSchema.index({ uid: 1, service: 1 }, { name: 'UNIQUE_UID_AND_SERVICE_INDEX', unique: true, background: true });

/**
 * Creating the mongoose module
 */
export const MetadataMongooseModule = MongooseModule.forFeature([
  {
    name: Metadata.name,
    schema: MetadataSchema,
    discriminators: [{ name: ChronicleMetadata.name, schema: ChronicleMetadataSchema }],
  },
]);
