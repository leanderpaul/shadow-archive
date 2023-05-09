/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { DatabaseModule } from '@app/providers/database';

import { ChronicleMetadataResolver } from './chronicle-metadata.resolver';
import { ChronicleMetadataService } from './chronicle-metadata.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [ChronicleMetadataResolver, ChronicleMetadataService, ContextService],
})
export class ChronicleMetadataModule {}
