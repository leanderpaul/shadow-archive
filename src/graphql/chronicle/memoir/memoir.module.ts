/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { DatabaseModule } from '@app/modules/database';

import { MemoirResolver } from './memoir.resolver';
import { MemoirService } from './memoir.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [MemoirResolver, MemoirService, GraphQLService],
})
export class MemoirModule {}
