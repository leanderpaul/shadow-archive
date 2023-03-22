/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { UserMongooseModule, ContextService } from '@app/providers';
import { AuthService, AuthModule } from '@app/shared/modules';

import { AccountsService } from './accounts.service';
import { AccountsResolver } from './accounts.resolver';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [AuthModule, UserMongooseModule],
  providers: [AccountsResolver, AccountsService, AuthService, ContextService],
})
export class AccountsModule {}
