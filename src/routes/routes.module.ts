/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AdminModule } from './admin';
import { HealthModule } from './health';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [HealthModule, AdminModule],
})
export class RoutesModule {}
