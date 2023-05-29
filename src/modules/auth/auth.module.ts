/**
 * Importing npm packages
 */

import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DatabaseModule } from '@app/modules/database';
import { UserModule } from '@app/modules/user';

import { AuthService } from './auth.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
