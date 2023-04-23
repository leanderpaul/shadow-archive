/**
 * Importing npm packages
 */
import { Field, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { Viewer } from '@app/graphql/accounts';
import { Paginated } from '@app/graphql/common';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@ObjectType()
export class User extends Viewer {
  @Field()
  type: string;

  @Field({ nullable: true })
  admin?: boolean;

  @Field()
  hasPasswordResetCode: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}

@ObjectType()
export class UserConnection extends Paginated(User) {}
