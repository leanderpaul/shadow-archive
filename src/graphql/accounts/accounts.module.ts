/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLModule } from '@app/graphql/common';
import { ContextService } from '@app/providers/context';
import { DatabaseModule } from '@app/providers/database';
import { MailService } from '@app/providers/mail';
import { AuthModule } from '@app/shared/modules';

import { AccountsService } from './accounts.service';
import { AccountsResolver } from './accounts.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const accountsResolvers = [AccountsResolver];

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [AccountsResolver, AccountsService, ContextService, MailService],
})
class AccountsModule {}

@Module({
  imports: [GraphQLModule.forRoot({ name: 'accounts', include: [AccountsModule], disableCSRFProtection: true }), AccountsModule],
})
export class AccountsGraphQLModule {}
