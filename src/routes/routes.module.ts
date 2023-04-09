/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { HealthModule } from './health';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [HealthModule],
})
export class RoutesModule {}
