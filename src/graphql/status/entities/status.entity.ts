/**
 * Importing npm packages
 */
import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@ObjectType({ description: 'Status of the services' })
export class Status {
  @Field({ description: 'Server status' })
  server: string;
}
