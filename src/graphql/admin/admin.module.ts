/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLModule } from '@app/graphql/common';
import { DatabaseModule } from '@app/providers/database';
import { AuthType } from '@app/shared/guards';

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
  providers: [AdminResolver, AdminService],
})
export class AdminModule {}

@Module({
  imports: [GraphQLModule.forRoot({ name: 'admin', include: [AdminModule], requiredAuth: AuthType.ADMIN }), AdminModule],
})
export class AdminGraphQLModule {}
