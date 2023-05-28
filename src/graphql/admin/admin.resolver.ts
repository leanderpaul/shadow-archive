/**
 * Importing npm packages
 */

import { Args, Info, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { UserService } from '@app/modules/user';
import { AuthType, UseAuth } from '@app/shared/decorators';

import { UserIdentifier } from './admin.dto';
import { User } from './admin.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
@UseAuth(AuthType.ADMIN)
export class AdminResolver {
  constructor(private readonly graphqlService: GraphQLService, private readonly userService: UserService) {}

  @Query(() => User, { name: 'user', nullable: true })
  async getUser(@Info() info: GraphQLResolveInfo, @Args() args: UserIdentifier): Promise<User | null> {
    const projection = this.graphqlService.getProjection(info);
    return await this.userService.getUser(args.identifier, projection);
  }

  @Query(() => Int, { name: 'totalUserCount' })
  getTotalUserCount(): Promise<number> {
    return this.userService.getTotalUserCount();
  }

  @Mutation(() => Boolean)
  async verifyEmail(@Args('email') email: string): Promise<boolean> {
    await this.userService.verifyUserEmail(email);
    return true;
  }
}
