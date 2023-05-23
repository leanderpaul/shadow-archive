/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLModule, GraphQLService } from '@app/graphql/common';
import { DatabaseModule } from '@app/modules/database';

import { AdminResolver } from './admin.resolver';
import { AdminService } from './admin.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const adminResolvers = [AdminResolver];

@Module({
  imports: [DatabaseModule],
  providers: [AdminResolver, AdminService, GraphQLService],
})
export class AdminModule {}

@Module({
  imports: [GraphQLModule.forRoot({ name: 'admin', include: [AdminModule] }), AdminModule],
})
export class AdminGraphQLModule {}
