/**
 * Importing npm packages
 */
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ResolveField } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { EAuthType, AuthType } from '@app/shared/decorators';
import { AuthGuard } from '@app/shared/guards';

import { AccountsService } from './accounts.service';
import { LoginArgs, RegisterArgs } from './dto';
import { Viewer } from './entities';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Resolver(() => Viewer)
export class AccountsResolver {
  constructor(private readonly accountsService: AccountsService) {}

  @AuthType(EAuthType.AUTHENTICATED)
  @UseGuards(AuthGuard)
  @Query(() => Viewer, { name: 'viewer' })
  getCurrentUser() {
    return this.accountsService.getUser();
  }

  @Mutation(() => Viewer)
  login(@Args() args: LoginArgs) {
    return this.accountsService.loginUser(args.email, args.password);
  }

  @Mutation(() => Viewer)
  register(@Args() args: RegisterArgs) {
    return this.accountsService.registerUser(args.email, args.password, args.name);
  }

  @Mutation(() => Boolean, { name: 'logout' })
  logout(@Args({ name: 'sessionId', nullable: true }) sessionId: string) {
    return this.accountsService.logoutUser(sessionId === '*');
  }

  @AuthType(EAuthType.AUTHENTICATED)
  @UseGuards(AuthGuard)
  @ResolveField(() => String, { name: 'csrfToken' })
  getCSRFToken() {
    return this.accountsService.getCSRFToken();
  }
}
