/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { HealthModule } from './health';
import { DevToolsModule } from './dev-tools';

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
