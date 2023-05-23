/**
 * Importing npm packages
 */
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';

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

  @Mutation(() => Exercise)
  async addExerciseRecord(@Args() args: AddExerciseArgs): Promise<Exercise> {
    return await this.memoirService.addMemoirField(args.date, 'exercises', args.input);
  }

  @Mutation(() => Exercise)
  async updateExerciseRecord(@Args() args: UpdateExerciseArgs): Promise<Exercise> {
    return await this.memoirService.updateMemoirField(args.date, 'exercises', args.index, args.update);
  }

  @Mutation(() => Exercise)
  async deleteExerciseRecord(@Args() args: DeleteArgs): Promise<Exercise> {
    return await this.memoirService.deleteMemoirField(args.date, 'exercises', args.index);
  }

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

  @Mutation(() => Food)
  async addFoodRecord(@Args() args: AddFoodArgs): Promise<Food> {
    return await this.memoirService.addMemoirField(args.date, 'foods', args.input);
  }

  @Mutation(() => Food)
  async updateFoodRecord(@Args() args: UpdateFoodArgs): Promise<Food> {
    return await this.memoirService.updateMemoirField(args.date, 'foods', args.index, args.update);
  }

  @Mutation(() => Food)
  async deleteFoodRecord(@Args() args: DeleteArgs): Promise<Food> {
    return await this.memoirService.deleteMemoirField(args.date, 'foods', args.index);
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
