/**
 * Importing npm packages
 */
import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@ObjectType()
export class Session {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  browser?: string;

  @Field({ nullable: true })
  os?: string;

  @Field({ nullable: true })
  device?: string;

  @Field(() => GraphQLISODateTime)
  accessedAt: Date;

  @Field(() => Boolean, { defaultValue: false })
  currentSession?: boolean;
}

@ObjectType()
export class Viewer {
  @Field(() => ID, { description: 'User ID' })
  uid: Types.ObjectId;

  @Field({ description: 'User email address' })
  email: string;

  @Field({ description: "User's full name" })
  name: string;

  @Field({ description: "Denotes whether the user's email address is verifed or not" })
  verified: boolean;

  @Field({ description: 'User avatar image uri', nullable: true })
  imageUrl?: string;

  @Field()
  csrfToken: string;

  @Field(() => [Session])
  sessions: Session[];
}
