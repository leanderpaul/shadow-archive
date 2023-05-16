/**
 * Importing npm packages
 */
import { Field, GraphQLISODateTime, ObjectType, OmitType } from '@nestjs/graphql';

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
export class User extends OmitType(Viewer, ['csrfToken'] as const) {
  @Field()
  type: string;

  @Field({ defaultValue: false })
  admin?: boolean;

  @Field()
  hasPasswordResetCode: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}

@ObjectType()
export class UserConnection extends Paginated(User) {}
