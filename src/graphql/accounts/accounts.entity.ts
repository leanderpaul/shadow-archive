/**
 * Importing npm packages
 */
import { ObjectType, Field, ID } from '@nestjs/graphql';

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
export class Viewer {
  @Field(() => ID, { description: 'User ID' })
  uid: string;

  @Field({ description: 'User email address' })
  email: string;

  @Field({ description: "User's full name" })
  name: string;

  @Field({ description: "Denotes whether the user's email address is verifed or not" })
  verified: boolean;

  @Field({ description: 'User avatar image uri', nullable: true })
  imageUrl?: string;
}
