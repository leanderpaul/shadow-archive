/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DevToolsModule } from './dev-tools';
import { HealthModule } from './health';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [HealthModule, DevToolsModule],
})
export class RoutesModule {}
