/**
 * Importing npm packages
 */
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { MemoirService } from '@app/modules/chronicle';
import { UseAuthGuard } from '@app/shared/decorators';

import { AddStringArgs, DeleteArgs, GetMemoirArgs, SleepArgs, UpdateStringArgs } from './dto';
import { Memoir, Sleep } from './memoir.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
@UseAuthGuard()
export class MemoirResolver {
  constructor(private readonly memoirService: MemoirService, private readonly graphqlService: GraphQLService) {}

  @Query(() => Memoir, { name: 'memoir' })
  async getMemoir(@Info() info: GraphQLResolveInfo, @Args() args: GetMemoirArgs): Promise<Memoir | null> {
    const projection = this.graphqlService.getProjection(info);
    const memoir = await this.memoirService.getMemoir(args.date, projection);
    return memoir;
  }

  @Mutation(() => Sleep)
  async addSleepRecord(@Args() args: SleepArgs): Promise<Sleep> {
    return await this.memoirService.updateMemoirSleep(args.date, args.input);
  }

  @Mutation(() => String)
  async addDiaryRecord(@Args() args: AddStringArgs): Promise<string> {
    return await this.memoirService.addMemoirField(args.date, 'diary', args.input);
  }

  @Mutation(() => String)
  async updateDiaryRecord(@Args() args: UpdateStringArgs): Promise<string> {
    return await this.memoirService.updateMemoirField(args.date, 'diary', args.index, args.update);
  }

  @Mutation(() => String)
  async deleteDiaryRecord(@Args() args: DeleteArgs): Promise<string> {
    return await this.memoirService.deleteMemoirField(args.date, 'diary', args.index);
  }

  @Mutation(() => String)
  async addEventRecord(@Args() args: AddStringArgs): Promise<string> {
    return await this.memoirService.addMemoirField(args.date, 'events', args.input);
  }

  @Mutation(() => String)
  async updateEventRecord(@Args() args: UpdateStringArgs): Promise<string> {
    return await this.memoirService.updateMemoirField(args.date, 'events', args.index, args.update);
  }

  @Mutation(() => String)
  async deleteEventRecord(@Args() args: DeleteArgs): Promise<string> {
    return await this.memoirService.deleteMemoirField(args.date, 'events', args.index);
  }
}
