/**
 * Importing npm packages
 */
import { Query, Resolver } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { UserService } from '@app/modules/user';
import { UseAuthGuard } from '@app/shared/decorators';
import { NeverError } from '@app/shared/errors';
import { Context } from '@app/shared/services';

import { Metadata } from './chronicle-metadata.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
@UseAuthGuard()
export class ChronicleMetadataResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => Metadata, { name: 'metadata' })
  async getMetadata(): Promise<Metadata> {
    const { uid } = Context.getCurrentUser(true);
    const user = await this.userService.getUser(uid, ['chronicle']);
    if (!user) throw new NeverError('user not found when authenticated');
    return user.chronicle;
  }
}
