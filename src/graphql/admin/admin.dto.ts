/**
 * Importing npm packages
 */
import { ArgsType, Field } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@ArgsType()
export class UserIdentifier {
  @Field({ description: 'Email address or UID' })
  identifier: string;
}
