/**
 * Importing npm packages
 */
import { Args, Info, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { type User } from '@app/modules/database';
import { AuthType, UseAuth } from '@app/shared/decorators';

import { LoginArgs, RegisterArgs, ResetPasswordArgs, UpdatePasswordArgs, UpdateUserArgs } from './accounts.dto';
import { Session, Viewer } from './accounts.entity';
import { AccountsService } from './accounts.service';

/**
 * Defining types
 */

type ResolvedViewer = Omit<Viewer, 'csrfToken'>;

/**
 * Declaring the constants
 */

@Resolver(() => Viewer)
export class AccountsResolver {
  constructor(private readonly accountsService: AccountsService, private readonly graphQLService: GraphQLService) {}

  @UseAuth(AuthType.AUTHENTICATED)
  @Query(() => Viewer, { name: 'viewer' })
  getCurrentUser(@Info() info: GraphQLResolveInfo): Promise<ResolvedViewer> {
    const projection = this.graphQLService.getProjection(info);
    return this.accountsService.getUser(projection);
  }

  @ResolveField(() => String, { name: 'csrfToken' })
  getCSRFToken(): string {
    return this.accountsService.getCSRFToken();
  }

  @ResolveField(() => [Session], { name: 'sessions' })
  getSessions(@Parent() parent: User): Session[] {
    return parent.sessions.map(session => this.accountsService.convertSession(session));
  }

  @Mutation(() => Viewer)
  async login(@Args() args: LoginArgs): Promise<ResolvedViewer> {
    return await this.accountsService.loginUser(args.email, args.password);
  }

  @Mutation(() => Viewer)
  async register(@Args() args: RegisterArgs): Promise<ResolvedViewer> {
    return await this.accountsService.registerUser(args.email, args.password, args.name);
  }

  @Mutation(() => Boolean)
  async verifyEmailAddress(@Args({ name: 'code' }) code: string): Promise<boolean> {
    await this.accountsService.verifyEmailAddress(code);
    return true;
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Args({ name: 'email' }) email: string): Promise<boolean> {
    await this.accountsService.forgotPassword(email);
    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(@Args() args: ResetPasswordArgs): Promise<boolean> {
    return await this.accountsService.resetPassword(args.code, args.newPassword);
  }

  @Mutation(() => Boolean)
  async updatePassword(@Args() args: UpdatePasswordArgs): Promise<boolean> {
    return await this.accountsService.updatePassword(args.oldPassword, args.newPassword);
  }

  @UseAuth(AuthType.AUTHENTICATED)
  @Mutation(() => Boolean)
  async resendEmailVerificationMail(): Promise<boolean> {
    await this.accountsService.resendEmailVerificationMail();
    return true;
  }

  @Mutation(() => Boolean, { name: 'logout' })
  async logout(@Args({ name: 'sessionId', nullable: true, description: 'pass -1 to clear all sessions', type: () => Int }) sessionId?: number): Promise<boolean> {
    await this.accountsService.logoutUser(sessionId);
    return true;
  }

  @Mutation(() => Viewer)
  updateUserProfile(@Args() update: UpdateUserArgs): Promise<ResolvedViewer> {
    return this.accountsService.updateUser(update);
  }
}
