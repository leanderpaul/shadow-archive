/**
 * Importing npm packages
 */

import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLUtils } from '@app/shared/utils';

import { UserQuery } from './admin.dto';
import { User, UserConnection } from './admin.entity';
import { AdminService } from './admin.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => User, { name: 'user', nullable: true })
  async getUser(@Args('identifier', { description: 'Email address or UID' }) identifier: string): Promise<User | null> {
    return await this.adminService.getUser(identifier);
  }

  @Query(() => UserConnection, { name: 'users' })
  getUserConnection(@Info() info: GraphQLResolveInfo, @Args() args: UserQuery): Promise<UserConnection> {
    return GraphQLUtils.getPaginationResult(info, args.page, {
      getItems: projection => this.adminService.searchUsers(projection, args.sort, args.page, args.email),
      getCount: () => this.adminService.getTotalUsers(args.email),
    });
  }

  @Mutation(() => Boolean, { name: 'verifyUser' })
  verifyUser(@Args('identifier', { description: 'Email address or UID' }) identifier: string): Promise<boolean> {
    return this.adminService.verifyUser(identifier);
  }
}
