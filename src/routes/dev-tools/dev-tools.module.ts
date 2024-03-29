/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AuthModule } from '@app/modules/auth';

import { DevToolsController } from './dev-tools.controller';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [AuthModule],
  controllers: [DevToolsController],
})
export class DevToolsModule {}
