/**
 * Importing npm packages
 */
import { Field, GraphQLISODateTime, Int, ObjectType, OmitType, registerEnumType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { Viewer } from '@app/graphql/accounts';
import { MigrationMode, MigrationStatus } from '@app/shared/services';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

registerEnumType(MigrationStatus, { name: 'MigrationStatus' });
registerEnumType(MigrationMode, { name: 'MigrationMode' });

@ObjectType()
export class User extends OmitType(Viewer, ['csrfToken'] as const) {
  @Field()
  type: string;

  @Field({ defaultValue: false })
  admin?: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}

@ObjectType()
export class Migration {
  @Field({ nullable: true })
  name?: string;

  @Field(() => MigrationStatus)
  status: MigrationStatus;

  @Field(() => MigrationMode, { nullable: true })
  mode?: MigrationMode;

  @Field({ nullable: true })
  error?: string;

  @Field(() => Int)
  progress: number;
}
