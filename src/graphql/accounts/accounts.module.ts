/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLModule, GraphQLService } from '@app/graphql/common';
import { AuthModule } from '@app/modules/auth';
import { UserModule } from '@app/modules/user';
import { IAMRole } from '@app/shared/constants';

import { AccountsResolver } from './accounts.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const accountsResolvers = [AccountsResolver];

@Module({
  imports: [AuthModule, UserModule],
  providers: [AccountsResolver, GraphQLService],
})
class AccountsModule {}

@Module({
  imports: [
    GraphQLModule.forRoot({
      name: 'accounts',
      include: [AccountsModule],
      inspectionRole: ['iam', IAMRole.ADMIN],
      disableCSRFProtection: true,
    }),
    AccountsModule,
  ],
})
export class AccountsGraphQLModule {}
