/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { UserModule } from '@app/modules/user';

import { ChronicleMetadataResolver } from './chronicle-metadata.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [UserModule],
  providers: [ChronicleMetadataResolver],
})
export class ChronicleMetadataModule {}
