/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLModule, GraphQLService } from '@app/graphql/common';
import { UserModule } from '@app/modules/user';
import { MigrationService } from '@app/shared/services';

import { AdminResolver } from './admin.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const adminResolvers = [AdminResolver];

@Module({
  imports: [UserModule],
  providers: [AdminResolver, GraphQLService, MigrationService],
})
export class AdminModule {}

@Module({
  imports: [GraphQLModule.forRoot({ name: 'admin', include: [AdminModule] }), AdminModule],
})
export class AdminGraphQLModule {}
