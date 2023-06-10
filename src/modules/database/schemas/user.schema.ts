/**
 * Importing npm packages
 */
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, type Model, type Query, type Types } from 'mongoose';
import sagus from 'sagus';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';

import { defaultOptionsPlugin, handleDuplicateKeyError } from '../database.utils';

/**
 * Defining types
 */

export enum UserActivityType {
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

interface UserStaticMethods {
  isNativeUser(user: User): user is NativeUser;
  isOAuthUser(user: User): user is OAuthUser;
}

export interface UserModel extends Omit<Model<User>, 'create' | 'insert' | 'insertMany'>, UserStaticMethods {}

export interface NativeUserModel extends Model<NativeUser>, UserStaticMethods {}

export interface OAuthUserModel extends Model<OAuthUser>, UserStaticMethods {}

/**
 * Declaring the constants
 */

/**
 * @class
 * Contains user session related data
 */
@Schema({ _id: false, versionKey: false })
export class UserSession {
  /** User session ID used to identify the session */
  @Prop({
    type: 'number',
    required: true,
  })
  id: number;

  /** User session token. This is the value stored in the user's cookie */
  @Prop({
    type: 'string',
    required: true,
    default: () => sagus.genRandom(32, 'base64'),
  })
  token: string;

  /** The browser from which the session was created */
  @Prop({
    type: 'string',
  })
  browser?: string;

  /** The device OS from which the session was created */
  @Prop({
    type: 'string',
  })
  os?: string;

  /** The device from which the session was created */
  @Prop({
    type: 'string',
  })
  device?: string;

  /** session last activity */
  @Prop({
    type: 'date',
    required: true,
    default: () => new Date(),
  })
  accessedAt: Date;
}

/**
 * @class
 * Contains user account activity
 */
@Schema({ _id: false })
export class UserActivity {
  @Prop({
    type: 'string',
    required: true,
    enum: Object.values(UserActivityType),
  })
  type: UserActivityType;

  @Prop({
    type: 'date',
    default: () => new Date(),
  })
  time: Date;
}

/**
 * @class
 * Contains data on how to group items in the chronicle app
 */
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
    required: [true, 'required'],
  })
  /** Name of the expense group */
  name: string;

  @Prop({
    type: ['string'],
    required: true,
  })
  /** Words to include in expense group */
  words: string[];
}

/**
 * @class
 * Contains all the metadata related details related for the chronicle app
 */
@Schema({ _id: false })
export class ChronicleMetadata {
  /** Difference between the expense security level 1 and -1  */
  @Prop({
    type: 'number',
    required: true,
    default: 0,
  })
  deviation: number;

  /** Array containg payment methods associated with the user */
  @Prop({
    type: ['string'],
    required: true,
  })
  paymentMethods: string[];
}

/**
 * @class
 * Contains all the data associated aith the user
 */
@Schema({ versionKey: false, timestamps: { updatedAt: false }, discriminatorKey: 'type' })
export class User {
  /** User ID, alias of _id */
  uid: Types.ObjectId;

  type: 'NativeUser' | 'OAuthUser';

  /** User's email address */
  @Prop({
    type: 'string',
    trim: true,
    lowercase: true,
    required: [true, 'required'],
    validate: [/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, 'should be an email'],
  })
  email: string;

  /** User's name */
  @Prop({
    type: 'string',
    trim: true,
    required: [true, 'required'],
    validate: [/^[a-zA-Z ]{3,32}$/, 'should have 3 - 32 characters and only contain alphabets and space'],
  })
  name: string;

  /** URL containing the user's profile pic */
  @Prop({
    type: 'string',
    validate: [/^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i, 'should be a valid URI'],
  })
  imageUrl?: string;

  /** Determines whether the user is an admin or not */
  @Prop({
    type: 'boolean',
  })
  admin?: boolean;

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

  /** Email verification code sent to the user to verify the email address. It is a base64 string */
  @Prop({
    type: 'string',
    default: (doc: User) => (doc.verified ? undefined : sagus.genRandom(16)),
  })
  emailVerificationCode?: string;

  /** Last 30 user activity logs */
  @Prop({
    type: [SchemaFactory.createForClass(UserActivity)],
    required: true,
  })
  activities: UserActivity[];

  /** chronicle app user metadata */
  @Prop({
    type: SchemaFactory.createForClass(ChronicleMetadata),
    default: { expenseCount: 0, paymentMethods: [], groups: [] },
  })
  chronicle: ChronicleMetadata;

  /** Date the user account was created */
  createdAt: Date;
}

/**
 * @class
 * Contains extra fields that are only required in a native user
 */
@Schema()
export class NativeUser extends User {
  /** User's hashed password */
  @Prop({
    type: 'string',
    required: [true, 'Password is requried'],
    validate: {
      msg: 'should have a minimum of 8 characters and have atleast one uppercase, lowercase, digit and, special character (#?!@$%^&*-)',
      validator: async function (this: Document<NativeUser> | Query<unknown, NativeUser>, password: string) {
        const isValid = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,32}$/.test(password);
        if (isValid) this.set('password', await sagus.hash(password));
        return isValid;
      },
    },
  })
  password: string;

  /** Password reset code sent to the user to verify the password reset link. It is of the format '<expiry date in unix timestamp>|<base64 code>' */
  @Prop({
    type: 'string',
  })
  passwordResetCode?: string;
}

/**
 * @class
 * Contains extra fields that are only required in a oauth user
 */

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

UserSchema.static('isNativeUser', (user: User) => 'password' in user);
UserSchema.static('isOAuthUser', (user: User) => 'refreshToken' in user);

/**
 * Setting up middlewares
 */
UserSchema.alias('_id', 'uid');
UserSchema.plugin(defaultOptionsPlugin);
UserSchema.post('save', handleDuplicateKeyError(new AppError(ErrorCode.R003)));

/**
 * Setting up the indexes
 */
UserSchema.index({ email: 1 }, { name: 'UNIQUE_EMAIL', unique: true, background: true });

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
