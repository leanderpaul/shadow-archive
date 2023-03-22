/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { StatusResolver } from './status.resolver';
import { StatusService } from './status.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Module({
  providers: [StatusResolver, StatusService],
})
export class StatusModule {}
