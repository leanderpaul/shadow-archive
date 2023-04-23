/**
 * Importing npm packages
 */

import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AuthModule } from '@app/shared/modules';

import { AdminController } from './admin.controller';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
