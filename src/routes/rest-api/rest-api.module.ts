/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AuthModule } from '@app/modules/auth';
import { UserModule } from '@app/modules/user';

import { RESTAPIController } from './rest-api.controller';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [AuthModule, UserModule],
  controllers: [RESTAPIController],
})
export class RESTAPIModule {}
