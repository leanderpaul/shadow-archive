/**
 * Importing npm packages
 */

import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DatabaseModule } from '@app/modules/database';

import { FictionChapterService } from './fiction-chapter.service';
import { FictionService } from './fiction.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [FictionService, FictionChapterService],
  exports: [FictionService, FictionChapterService],
})
export class FictionModule {}
