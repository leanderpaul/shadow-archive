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

import { ChronicleUser, ChronicleUserSchema } from './chronicle/chronicle-user.schema';
import { FictionUser, FictionUserSchema } from './fiction/fiction-user.schema';
import { ArchiveUser, ArchiveUserSchema } from './iam/archive-user.schema';
import { IAMUser, IAMUserSchema } from './iam/iam-user.schema';
import { UserActivity, UserActivitySchema } from './iam/user-activity.schema';
import { UserSession, UserSessionSchema } from './iam/user-session.schema';
import { defaultOptionsPlugin, handleDuplicateKeyError } from './schema.utils';

/**
 * Defining types
 */

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

  /** Denotes whether a user email address is verified or not */
  @Prop({
    type: 'boolean',
    required: true,
    default: false,
  })
  verified: boolean;

  /** Array storing the session details of the user */
  @Prop({
    type: [UserSessionSchema],
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
    type: [UserActivitySchema],
    required: true,
  })
  activities: UserActivity[];

  /** IAM user config */
  @Prop({
    type: IAMUserSchema,
    required: true,
    default: {},
  })
  iam: IAMUser;

  /** chronicle user config */
  @Prop({
    type: ChronicleUserSchema,
    required: true,
    default: {},
  })
  chronicle: ChronicleUser;

  /** fiction user config */
  @Prop({
    type: FictionUserSchema,
    required: true,
    default: {},
  })
  fiction: FictionUser;

  /** archive user config */
  @Prop({
    type: ArchiveUserSchema,
    required: true,
    default: {},
  })
  archive: ArchiveUser;

  /** Date the user account was created */
  createdAt: Date;
}

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
