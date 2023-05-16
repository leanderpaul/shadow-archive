/**
 * Importing npm packages
 */
import { Args, Info, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { type User } from '@app/providers/database';
import { AuthType, UseAuth } from '@app/shared/decorators';
import { GraphQLUtils } from '@app/shared/utils';

import { LoginArgs, RegisterArgs, ResetPasswordArgs, UpdatePasswordArgs, UpdateUserArgs } from './accounts.dto';
import { Session, Viewer } from './accounts.entity';
import { AccountsService } from './accounts.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver(() => Viewer)
export class AccountsResolver {
  constructor(private readonly accountsService: AccountsService) {}

  @UseAuth(AuthType.AUTHENTICATED)
  @Query(() => Viewer, { name: 'viewer' })
  getCurrentUser(@Info() info: GraphQLResolveInfo) {
    const projection = GraphQLUtils.getProjection(info);
    return this.accountsService.getUser(projection);
  }

  @ResolveField(() => String, { name: 'csrfToken' })
  getCSRFToken() {
    return this.accountsService.getCSRFToken();
  }

  @ResolveField(() => [Session], { name: 'sessions' })
  getSessions(@Parent() parent: User) {
    return parent.sessions.map(session => this.accountsService.convertSession(session));
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

  @UseAuth(AuthType.AUTHENTICATED)
  @Mutation(() => Boolean)
  resendEmailVerificationMail() {
    this.accountsService.resendEmailVerificationMail();
    return true;
  }

  @Mutation(() => Boolean, { name: 'logout' })
  async logout(@Args({ name: 'sessionId', nullable: true, description: 'pass -1 to clear all sessions', type: () => Int }) sessionId?: number) {
    await this.accountsService.logoutUser(sessionId);
    return true;
  }

  @Mutation(() => Viewer)
  updateUserProfile(@Args() update: UpdateUserArgs) {
    return this.accountsService.updateUser(update);
  }
}
