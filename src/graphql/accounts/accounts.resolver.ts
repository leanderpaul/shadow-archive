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
import { LoginArgs, RegisterArgs, ResetPasswordArgs, UpdatePasswordArgs } from './dto';
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
  async login(@Args() args: LoginArgs) {
    return await this.accountsService.loginUser(args.email, args.password);
  }

  @Mutation(() => Viewer)
  async register(@Args() args: RegisterArgs) {
    return await this.accountsService.registerUser(args.email, args.password, args.name);
  }

  @Mutation(() => Boolean)
  async verifyEmailAddress(@Args({ name: 'code' }) code: string) {
    await this.accountsService.verifyEmailAddress(code);
  }

  @Mutation(() => Boolean)
  forgotPassword(@Args({ name: 'email' }) email: string) {
    this.accountsService.forgotPassword(email);
    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(@Args() args: ResetPasswordArgs) {
    return await this.accountsService.resetPassword(args.code, args.newPassword);
  }

  @Mutation(() => Boolean)
  async updatePassword(@Args() args: UpdatePasswordArgs) {
    return await this.accountsService.updatePassword(args.oldPassword, args.newPassword);
  }

  @AuthType(EAuthType.AUTHENTICATED)
  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  resendEmailVerificationMail() {
    this.accountsService.resendEmailVerificationMail();
    return true;
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
