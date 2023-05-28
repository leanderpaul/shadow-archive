/**
 * Importing npm packages
 */
import { Args, Info, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { AuthService } from '@app/modules/auth';
import { type User } from '@app/modules/database';
import { UserAuthService, UserService } from '@app/modules/user';
import { AuthType, UseAuth } from '@app/shared/decorators';
import { NeverError } from '@app/shared/errors';
import { Context } from '@app/shared/services';

import { LoginArgs, RegisterArgs, ResetPasswordArgs, UpdatePasswordArgs, UpdateUserArgs } from './accounts.dto';
import { Session, Viewer } from './accounts.entity';

/**
 * Defining types
 */

type ResolvedViewer = Omit<Viewer, 'csrfToken'>;

/**
 * Declaring the constants
 */

@Resolver(() => Viewer)
export class AccountsResolver {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userAuthService: UserAuthService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseAuth(AuthType.AUTHENTICATED)
  @Query(() => Viewer, { name: 'viewer' })
  async getCurrentUser(@Info() info: GraphQLResolveInfo): Promise<ResolvedViewer> {
    const { uid } = Context.getCurrentUser(true);
    const projection = this.graphQLService.getProjection(info);
    const user = await this.userService.getUser(uid, projection);
    if (!user) throw new NeverError('current user not found');
    return user;
  }

  @ResolveField(() => String, { name: 'csrfToken' })
  getCSRFToken(): string {
    return this.authService.generateCSRFToken();
  }

  @ResolveField(() => [Session], { name: 'sessions' })
  getSessions(@Parent() parent: User): Session[] {
    const currentSession = Context.getCurrentSession(true);
    return parent.sessions.map(session => ({ ...session, currentSession: session.id === currentSession.id }));
  }

  @Mutation(() => Viewer)
  async login(@Args() args: LoginArgs): Promise<ResolvedViewer> {
    return await this.userAuthService.loginUser(args.email, args.password);
  }

  @Mutation(() => Viewer)
  async register(@Args() args: RegisterArgs): Promise<ResolvedViewer> {
    return await this.userAuthService.registerNativeUser(args.name, args.email, args.password);
  }

  @Mutation(() => Boolean)
  async verifyEmail(@Args({ name: 'code' }) code: string): Promise<boolean> {
    await this.userService.verifyUserEmail(code);
    return true;
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Args({ name: 'email' }) email: string): Promise<boolean> {
    await this.userAuthService.sendResetPasswordMail(email);
    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(@Args() args: ResetPasswordArgs): Promise<boolean> {
    return await this.userAuthService.resetPassword(args.code, args.newPassword);
  }

  @Mutation(() => Boolean)
  async updatePassword(@Args() args: UpdatePasswordArgs): Promise<boolean> {
    await this.userService.updatePassword(args.oldPassword, args.newPassword);
    return true;
  }

  @UseAuth(AuthType.AUTHENTICATED)
  @Mutation(() => Boolean)
  async resendEmailVerificationMail(): Promise<boolean> {
    await this.userAuthService.sendEmailVerificationMail();
    return true;
  }

  @Mutation(() => Boolean, { name: 'logout' })
  async logout(@Args({ name: 'sessionId', nullable: true, description: 'pass -1 to clear all sessions', type: () => Int }) sessionId?: number): Promise<boolean> {
    const { uid } = Context.getCurrentUser(true);
    const session = Context.getCurrentSession(true);
    await this.userAuthService.logout(uid, sessionId ?? session.id);
    return true;
  }

  @Mutation(() => Viewer)
  updateUserProfile(@Args() update: UpdateUserArgs): Promise<ResolvedViewer> {
    const { uid } = Context.getCurrentUser(true);
    return this.userService.updateUser(uid, update);
  }
}
