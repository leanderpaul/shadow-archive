/**
 * Importing npm packages
 */

import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DatabaseModule } from '@app/modules/database';
import { MailService } from '@app/providers/mail';

import { AuthService } from './auth.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [AuthService, MailService],
  exports: [AuthService],
})
export class AuthModule {}
