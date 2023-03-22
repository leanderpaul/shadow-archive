/**
 * Importing npm packages
 */
import { Schema, Prop, SchemaFactory, MongooseModule } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { transformId, defaultOptionsPlugin } from '../database.utils';

/**
 * Importing and defining types
 */
import type { ObjectId } from 'mongoose';

/**
 * Declaring the constants
 */

const nameRegex = /^[a-zA-Z\ ]{3,32}$/;
const uriRegex = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i;
const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/**
 * Defining the schemas
 */

@Schema({ _id: false, versionKey: false })
export class UserSession {
  /** User session id. This is the value stored in the user's cookie */
  @Prop({
    type: 'string',
    required: true,
  })
  id: string;

  /** The date the session was created on */
  @Prop({
    type: 'date',
    required: true,
  })
  expireAt: Date;
}

@Schema({
  versionKey: false,
  timestamps: true,
  discriminatorKey: 'type',
})
export class User {
  _id: ObjectId;

  /** User ID, alias of _id */
  uid: string;

  type: 'NativeUser' | 'OAuthUser';

  /** User's email address */
  @Prop({
    trim: true,
    type: 'string',
    lowercase: true,
    required: [true, 'Email is required'],
    validate: [emailRegex, "Email '{VALUE}' is invalid"],
  })
  email: string;

  /** User's name */
  @Prop({
    trim: true,
    type: 'string',
    required: [true, 'Name is required'],
    validate: [nameRegex, "Name '{VALUE}' is invalid"],
  })
  name: string;

  /** URL containing the user's profile pic */
  @Prop({
    type: 'string',
    validate: [uriRegex, "Image URI '{VALUE}' is invalid"],
  })
  imageUrl?: string;

  /** Denotes whether a user email address is verified or not */
  @Prop({
    type: 'boolean',
    required: true,
    default: false,
  })
  verified: boolean;

  /** Array storing the session details of the user */
  @Prop({
    type: [SchemaFactory.createForClass(UserSession)],
    required: true,
  })
  sessions: UserSession[];
}

@Schema()
export class NativeUser extends User {
  /** User's hashed password */
  @Prop({
    type: 'string',
    required: [true, 'Password is requried'],
  })
  password: string;
}

@Schema()
export class OAuthUser extends User {
  /** Service provider's user id */
  @Prop({
    type: 'string',
    required: true,
  })
  spuid: string;

  /** Service Provider's hashed refresh token */
  @Prop({
    type: 'string',
    required: true,
  })
  refreshToken: string;
}

/**
 * Creating the mongoose Schema
 */
export const UserSchema = SchemaFactory.createForClass(User);
export const NativeUserSchema = SchemaFactory.createForClass(NativeUser);
export const OAuthUserSchema = SchemaFactory.createForClass(OAuthUser);

/**
 * Setting up middlewares
 */
UserSchema.virtual('uid').get(transformId);
UserSchema.plugin(defaultOptionsPlugin);

/**
 * Setting up the indexes
 */
UserSchema.index({ email: 1 }, { name: 'UNIQUE_EMAIL_INDEX', unique: true, background: true });

/**
 * Creating the mongoose module
 */
export const UserMongooseModule = MongooseModule.forFeature([
  {
    name: User.name,
    schema: UserSchema,
    discriminators: [
      { name: NativeUser.name, schema: NativeUserSchema },
      { name: OAuthUser.name, schema: OAuthUserSchema },
    ],
  },
]);
