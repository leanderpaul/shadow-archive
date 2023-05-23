/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DatabaseModule } from '@app/modules/database';

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
  providers: [ChronicleMetadataResolver, ChronicleMetadataService],
})
export class ChronicleMetadataModule {}
