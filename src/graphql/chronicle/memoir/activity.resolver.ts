/**
 * Importing npm packages
 */
import { Args, Mutation, Resolver } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { MemoirService } from '@app/modules/chronicle';
import { UseAuthGuard } from '@app/shared/decorators';

import { AddActivityArgs, DeleteArgs, UpdateActivityArgs } from './dto';
import { Activity } from './memoir.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
@UseAuthGuard()
export class ActivityResolver {
  constructor(private readonly memoirService: MemoirService) {}

  @Mutation(() => Activity)
  async addActivityRecord(@Args() args: AddActivityArgs): Promise<Activity> {
    return await this.memoirService.addMemoirField(args.date, 'activities', args.input);
  }

  @Mutation(() => Activity)
  async updateActivityRecord(@Args() args: UpdateActivityArgs): Promise<Activity> {
    return await this.memoirService.updateMemoirField(args.date, 'activities', args.index, args.update);
  }

  @Mutation(() => Activity)
  async deleteActivityRecord(@Args() args: DeleteArgs): Promise<Activity> {
    return await this.memoirService.deleteMemoirField(args.date, 'activities', args.index);
  }
}
