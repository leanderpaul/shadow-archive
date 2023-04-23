/**
 * Importing npm packages
 */
import { Module, OnModuleInit } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DatabaseModule } from '@app/providers/database';

import { GraphQLModule } from '../common';
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
  imports: [GraphQLModule.forRoot({ name: 'admin', include: [AdminModule] }), AdminModule],
})
export class AdminGraphQLModule {}
