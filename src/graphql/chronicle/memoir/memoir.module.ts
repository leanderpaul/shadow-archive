/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { DatabaseModule } from '@app/providers/database';

import { MemoirService } from './memoir.service';
import { MemoirResolver } from './memoir.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [MemoirResolver, MemoirService, ContextService],
})
export class MemoirModule {}
