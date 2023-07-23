/**
 * Importing npm packages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import sagus from 'sagus';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
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

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
