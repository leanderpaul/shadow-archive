/**
 * Importing npm packages
 */

import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type ObjectId } from 'mongodb';
import { type Document, type Model, type Query } from 'mongoose';
import sagus from 'sagus';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';

import { defaultOptionsPlugin, handleDuplicateKeyError, transformId } from '../database.utils';

/**
 * Defining types
 */

export enum UserActivityType {
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
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
const nameRegex = /^[a-zA-Z ]{3,32}$/;
const uriRegex = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i;
const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const duplicateEmailError = new AppError(ErrorCode.R003);

/**
 * Defining the schemas
 */

/**
 * @class
 * Contains user session related data
 */
@Schema({ _id: false, versionKey: false })
export class UserSession {
  /** User session ID used to identify the session */
  @Prop({ type: 'number', required: true })
  id: number;

  /** User session token. This is the value stored in the user's cookie */
  @Prop({ type: 'string', required: true })
  token: string;

  /** The browser from which the session was created */
  @Prop({ type: 'string' })
  browser?: string;

  /** The device OS from which the session was created */
  @Prop({ type: 'string' })
  os?: string;

  /** The device from which the session was created */
  @Prop({ type: 'string' })
  device?: string;

  /** session last activity */
  @Prop({ type: 'date', required: true })
  accessedAt: Date;
}

/**
 * @class
 * Contains user account activity
 */
@Schema({ _id: false })
export class UserActivity {
  @Prop({ type: 'string', required: true, enum: Object.values(UserActivityType) })
  type: UserActivityType;

  @Prop({ type: 'date', default: () => new Date() })
  time: Date;
}

/**
 * @class
 * Contains data on how to group items in the chronicle app
 */
@Schema({ _id: false })
export class ExpenseGroup {
  /** Expense group ID */
  @Prop({ type: 'number', required: true, min: 1 })
  id: number;

  @Prop({ type: 'string', required: [true, 'Expense group name is required'], validate: [nameRegex, `Expense group name '{VALUE}' is invalid`] })
  /** Name of the expense group */
  name: string;

  @Prop({
    type: ['string'],
    required: true,
    match: [nameRegex, `Expense group word '{VALUE}' is invalid`],
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
  /** The total count of the expenses or bills that the user has added */
  @Prop({ type: 'number', required: true, default: 0, min: 0 })
  expenseCount: number;

  /** Array containg payment methods associated with the user */
  @Prop({ type: ['string'], required: true, match: [nameRegex, `Payment Method '{VALUE}' is invalid`] })
  pms: string[];

  /** Array containg the expense groups associated with the user */
  @Prop({ type: [SchemaFactory.createForClass(ExpenseGroup)], requried: true })
  groups: ExpenseGroup[];
}

/**
 * @class
 * Contains all the data associated aith the user
 */
@Schema({ versionKey: false, timestamps: { createdAt: true }, discriminatorKey: 'type' })
export class User {
  _id: ObjectId;

  /** User ID, alias of _id */
  uid: string;

  type: 'NativeUser' | 'OAuthUser';

  /** User's email address */
  @Prop({ trim: true, type: 'string', lowercase: true, required: [true, 'Email is required'], validate: [emailRegex, 'should be an email'] })
  email: string;

  /** User's name */
  @Prop({ trim: true, type: 'string', required: [true, 'should have 3 - 32 characters and only contain alphabets and space'], validate: [nameRegex, "Name '{VALUE}' is invalid"] })
  name: string;

  /** URL containing the user's profile pic */
  @Prop({ type: 'string', validate: [uriRegex, 'should be a uri'] })
  imageUrl?: string;

  /** Determines whether the user is an admin or not */
  @Prop({ type: 'boolean' })
  admin?: boolean;

  /** Denotes whether a user email address is verified or not */
  @Prop({ type: 'boolean', required: true, default: false })
  verified: boolean;

  /** Array storing the session details of the user */
  @Prop({ type: [SchemaFactory.createForClass(UserSession)], required: true })
  sessions: UserSession[];

  /** Email verification code sent to the user to verify the email address. It is a base64 string */
  @Prop({ type: 'string' })
  emailVerificationCode?: string;

  /** Password reset code sent to the user to verify the password reset link. It is of the format '<expiry date in unix timestamp>|<base64 code>' */
  @Prop({ type: 'string' })
  passwordResetCode?: string;

  /** Last 30 user activity logs */
  @Prop({ type: [SchemaFactory.createForClass(UserActivity)], required: true })
  activities: UserActivity[];

  /** chronicle app user metadata */
  @Prop({ type: SchemaFactory.createForClass(ChronicleMetadata), default: { expenseCount: 0, pms: [], groups: [] } })
  chronicle?: ChronicleMetadata;

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
        const isValid = passwordRegex.test(password);
        if (isValid) this.set('password', await sagus.hash(password));
        return isValid;
      },
    },
  })
  password: string;
}

/**
 * @class
 * Contains extra fields that are only required in a oauth user
 */

@Schema()
export class OAuthUser extends User {
  /** Service provider's user id */
  @Prop({ type: 'string', required: true })
  spuid: string;

  /** Service Provider's hashed refresh token */
  @Prop({ type: 'string', required: true })
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
UserSchema.virtual('uid').get(transformId);
UserSchema.plugin(defaultOptionsPlugin);
UserSchema.post('save', handleDuplicateKeyError(duplicateEmailError));
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
