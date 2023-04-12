/**
 * Importing npm packages
 */
import { Resolver, Query, Args, ResolveField, Info, Mutation } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { PageInput } from '@app/graphql/common';
import { AuthType, UseAuth } from '@app/shared/decorators';
import { GraphQLUtils } from '@app/shared/utils';

import { ChronicleService } from './chronicle.service';
import { GetExpensesArgs, AddExpenseInput, UpdateExpenseInput, SleepArgs, GetMemoirArgs, DeleteArgs, AddStringArgs, UpdateStringArgs } from './dto';
import { AddActivityArgs, AddExerciseArgs, AddFoodArgs, UpdateActivityArgs, UpdateExerciseArgs, UpdateFoodArgs } from './dto';
import { Chronicle, Expense, ExpenseConnection, Metadata, Memoir, Sleep, Exercise, Activity, Food } from './entities';

/**
 * Importing and defining types
 */
import type { GraphQLResolveInfo } from 'graphql';

/**
 * Declaring the constants
 */

@UseAuth(AuthType.VERIFIED)
@Resolver(() => Chronicle)
export class ChronicleResolver {
  constructor(private readonly chronicleService: ChronicleService) {}

  @Query(() => Chronicle, { name: 'chronicle' })
  getChronicle() {
    return {};
  }

  @ResolveField('expense', () => Expense)
  getExpense(@Info() info: GraphQLResolveInfo, @Args('eid') eid: string) {
    const projection = GraphQLUtils.getProjection<Expense>(info);
    return this.chronicleService.findOneExpense(eid, projection);
  }

  @ResolveField('expenses', () => ExpenseConnection)
  async getExpenseConnection(@Info() info: GraphQLResolveInfo, @Args() args: GetExpensesArgs) {
    /** Validations */
    PageInput.isValid(args.page);

    const promises = [] as Promise<unknown>[];
    const result = {} as Partial<ExpenseConnection>;
    const projection = GraphQLUtils.getProjection<ExpenseConnection>(info);

    if (projection.items) {
      const promise = this.chronicleService.findExpenses(projection.items, args.sort, args.page, args.query);
      promise.then(items => (result.items = items));
      promises.push(promise);
    }

    if (projection.page || projection.totalCount) {
      const promise = this.chronicleService.getTotalExpenses(args.query);
      promise.then(count => (result.totalCount = count));
      promises.push(promise);
    }

    await Promise.all(promises);
    if (projection.page) {
      const hasPrev = args.page.offset > 0;
      const hasNext = result.totalCount! > args.page.offset + args.page.limit;
      result.page = { hasPrev, hasNext };
    }

    return result;
  }

  @Mutation(() => Expense)
  async addExpense(@Args('input') input: AddExpenseInput) {
    return await this.chronicleService.addExpense(input);
  }

  @Mutation(() => Expense)
  async updateExpense(@Args('eid') eid: string, @Args('update') update: UpdateExpenseInput) {
    return await this.chronicleService.updateExpense(eid, update);
  }

  @Mutation(() => Expense)
  async removeExpense(@Args('eid') eid: string) {
    return await this.chronicleService.removeExpense(eid);
  }

  @ResolveField('memoir', () => Memoir)
  async getMemoir(@Info() info: GraphQLResolveInfo, @Args() args: GetMemoirArgs) {
    const projection = GraphQLUtils.getProjection(info);
    const memoir = await this.chronicleService.getMemoir(args.date, projection);
    return memoir || args;
  }

  @Mutation(() => Sleep)
  async addSleepRecord(@Args() args: SleepArgs) {
    return await this.chronicleService.updateMemoirSleep(args.date, args.input);
  }

  @Mutation(() => Exercise)
  async addExerciseRecord(@Args() args: AddExerciseArgs) {
    return await this.chronicleService.addMemoirField(args.date, 'exercises', args.input);
  }

  @Mutation(() => Exercise)
  async updateExerciseRecord(@Args() args: UpdateExerciseArgs) {
    return await this.chronicleService.updateMemoirField(args.date, 'exercises', args.index, args.update);
  }

  @Mutation(() => Exercise)
  async deleteExerciseRecord(@Args() args: DeleteArgs) {
    return await this.chronicleService.deleteMemoirField(args.date, 'exercises', args.index);
  }

  @Mutation(() => Activity)
  async addActivityRecord(@Args() args: AddActivityArgs) {
    return await this.chronicleService.addMemoirField(args.date, 'activities', args.input);
  }

  @Mutation(() => Activity)
  async updateActivityRecord(@Args() args: UpdateActivityArgs) {
    return await this.chronicleService.updateMemoirField(args.date, 'activities', args.index, args.update);
  }

  @Mutation(() => Activity)
  async deleteActivityRecord(@Args() args: DeleteArgs) {
    return await this.chronicleService.deleteMemoirField(args.date, 'activities', args.index);
  }

  @Mutation(() => Food)
  async addFoodRecord(@Args() args: AddFoodArgs) {
    return await this.chronicleService.addMemoirField(args.date, 'foods', args.input);
  }

  @Mutation(() => Food)
  async updateFoodRecord(@Args() args: UpdateFoodArgs) {
    return await this.chronicleService.updateMemoirField(args.date, 'foods', args.index, args.update);
  }

  @Mutation(() => Food)
  async deleteFoodRecord(@Args() args: DeleteArgs) {
    return await this.chronicleService.deleteMemoirField(args.date, 'foods', args.index);
  }

  @Mutation(() => String)
  async addDiaryRecord(@Args() args: AddStringArgs) {
    return await this.chronicleService.addMemoirField(args.date, 'diary', args.input);
  }

  @Mutation(() => String)
  async updateDiaryRecord(@Args() args: UpdateStringArgs) {
    return await this.chronicleService.updateMemoirField(args.date, 'diary', args.index, args.update);
  }

  @Mutation(() => String)
  async deleteDiaryRecord(@Args() args: DeleteArgs) {
    return await this.chronicleService.deleteMemoirField(args.date, 'diary', args.index);
  }

  @Mutation(() => String)
  async addEventRecord(@Args() args: AddStringArgs) {
    return await this.chronicleService.addMemoirField(args.date, 'events', args.input);
  }

  @Mutation(() => String)
  async updateEventRecord(@Args() args: UpdateStringArgs) {
    return await this.chronicleService.updateMemoirField(args.date, 'events', args.index, args.update);
  }

  @Mutation(() => String)
  async deleteEventRecord(@Args() args: DeleteArgs) {
    return await this.chronicleService.deleteMemoirField(args.date, 'events', args.index);
  }

  @ResolveField('metadata', () => Metadata)
  async getMetadata() {
    const metadata = await this.chronicleService.getUserMetadata();
    return metadata || {};
  }
}
