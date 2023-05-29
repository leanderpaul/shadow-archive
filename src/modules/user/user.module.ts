/**
 * Importing npm packages
 */

import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DatabaseModule } from '@app/modules/database';
import { MailService } from '@app/providers/mail';

import { CookieService } from './cookie.service';
import { UserAuthService } from './user-auth.service';
import { UserService } from './user.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [DatabaseModule],
  providers: [MailService, CookieService, UserAuthService, UserService],
  exports: [CookieService, UserAuthService, UserService],
})
export class UserModule {}
