/**
 * Importing npm packages
 */
import { Resolver, Query } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { Status } from './entities';
import { StatusService } from './status.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Resolver(() => Status)
export class StatusResolver {
  constructor(private readonly serverService: StatusService) {}

  @Query(() => Status, { name: 'status' })
  getStatus() {
    const server = this.serverService.getServerStatus();
    return { server };
  }
}
