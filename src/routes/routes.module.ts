/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DevToolsModule } from './dev-tools';
import { HealthModule } from './health';
import { RESTAPIModule } from './rest-api';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [HealthModule, DevToolsModule, RESTAPIModule],
})
export class RoutesModule {}
