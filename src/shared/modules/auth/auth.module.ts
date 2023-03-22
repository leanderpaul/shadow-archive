/**
 * Importing npm packages
 */

import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ContextService, UserMongooseModule } from '@app/providers';

import { AuthService } from './auth.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [UserMongooseModule],
  providers: [AuthService, ContextService],
  exports: [AuthService],
})
export class AuthModule {}
