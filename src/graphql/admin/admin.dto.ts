/**
 * Importing npm packages
 */
import { ArgsType, Field } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { MigrationMode } from '@app/shared/services';

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

@ArgsType()
export class MigrationArgs {
  @Field(() => MigrationMode, { nullable: true, defaultValue: MigrationMode.DRY })
  mode: MigrationMode;
}
