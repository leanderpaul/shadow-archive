/**
 * Importing npm packages
 */
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLUtils } from '@app/shared/utils';

import { AddActivityArgs, UpdateActivityArgs } from './dto/activity.args';
import { AddStringArgs, DeleteArgs, GetMemoirArgs, SleepArgs, UpdateStringArgs } from './dto/common.args';
import { AddExerciseArgs, UpdateExerciseArgs } from './dto/exercise.args';
import { AddFoodArgs, UpdateFoodArgs } from './dto/food.args';
import { Activity, Exercise, Food, Memoir, Sleep } from './memoir.entity';
import { MemoirService } from './memoir.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
export class MemoirResolver {
  constructor(private readonly memoirService: MemoirService) {}

  @Query(() => Memoir, { name: 'memoir' })
  async getMemoir(@Info() info: GraphQLResolveInfo, @Args() args: GetMemoirArgs) {
    const projection = GraphQLUtils.getProjection(info);
    const memoir = await this.memoirService.getMemoir(args.date, projection);
    return memoir || args;
  }

  @Mutation(() => Sleep)
  async addSleepRecord(@Args() args: SleepArgs) {
    return await this.memoirService.updateMemoirSleep(args.date, args.input);
  }

  @Mutation(() => Exercise)
  async addExerciseRecord(@Args() args: AddExerciseArgs) {
    return await this.memoirService.addMemoirField(args.date, 'exercises', args.input);
  }

  @Mutation(() => Exercise)
  async updateExerciseRecord(@Args() args: UpdateExerciseArgs) {
    return await this.memoirService.updateMemoirField(args.date, 'exercises', args.index, args.update);
  }

  @Mutation(() => Exercise)
  async deleteExerciseRecord(@Args() args: DeleteArgs) {
    return await this.memoirService.deleteMemoirField(args.date, 'exercises', args.index);
  }

  @Mutation(() => Activity)
  async addActivityRecord(@Args() args: AddActivityArgs) {
    return await this.memoirService.addMemoirField(args.date, 'activities', args.input);
  }

  @Mutation(() => Activity)
  async updateActivityRecord(@Args() args: UpdateActivityArgs) {
    return await this.memoirService.updateMemoirField(args.date, 'activities', args.index, args.update);
  }

  @Mutation(() => Activity)
  async deleteActivityRecord(@Args() args: DeleteArgs) {
    return await this.memoirService.deleteMemoirField(args.date, 'activities', args.index);
  }

  @Mutation(() => Food)
  async addFoodRecord(@Args() args: AddFoodArgs) {
    return await this.memoirService.addMemoirField(args.date, 'foods', args.input);
  }

  @Mutation(() => Food)
  async updateFoodRecord(@Args() args: UpdateFoodArgs) {
    return await this.memoirService.updateMemoirField(args.date, 'foods', args.index, args.update);
  }

  @Mutation(() => Food)
  async deleteFoodRecord(@Args() args: DeleteArgs) {
    return await this.memoirService.deleteMemoirField(args.date, 'foods', args.index);
  }

  @Mutation(() => String)
  async addDiaryRecord(@Args() args: AddStringArgs) {
    return await this.memoirService.addMemoirField(args.date, 'diary', args.input);
  }

  @Mutation(() => String)
  async updateDiaryRecord(@Args() args: UpdateStringArgs) {
    return await this.memoirService.updateMemoirField(args.date, 'diary', args.index, args.update);
  }

  @Mutation(() => String)
  async deleteDiaryRecord(@Args() args: DeleteArgs) {
    return await this.memoirService.deleteMemoirField(args.date, 'diary', args.index);
  }

  @Mutation(() => String)
  async addEventRecord(@Args() args: AddStringArgs) {
    return await this.memoirService.addMemoirField(args.date, 'events', args.input);
  }

  @Mutation(() => String)
  async updateEventRecord(@Args() args: UpdateStringArgs) {
    return await this.memoirService.updateMemoirField(args.date, 'events', args.index, args.update);
  }

  @Mutation(() => String)
  async deleteEventRecord(@Args() args: DeleteArgs) {
    return await this.memoirService.deleteMemoirField(args.date, 'events', args.index);
  }
}
