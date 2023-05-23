/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLModule, GraphQLService } from '@app/graphql/common';
import { AuthModule } from '@app/modules/auth';
import { DatabaseModule } from '@app/modules/database';
import { MailService } from '@app/providers/mail';

import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const accountsResolvers = [AccountsResolver];

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [AccountsResolver, AccountsService, MailService, GraphQLService],
})
class AccountsModule {}

@Module({
  imports: [GraphQLModule.forRoot({ name: 'accounts', include: [AccountsModule], disableCSRFProtection: true }), AccountsModule],
})
export class AccountsGraphQLModule {}
