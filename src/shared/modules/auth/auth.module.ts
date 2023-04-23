/**
 * Importing npm packages
 */

import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { DatabaseModule } from '@app/providers/database';
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
  providers: [AuthService, ContextService, MailService],
  exports: [AuthService, ContextService],
})
export class AuthModule {}
