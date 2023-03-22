/**
 * Importing npm packages
 */
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, ResolveField, Info, Mutation } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { AppError } from '@app/shared/errors';
import { AuthGuard } from '@app/shared/guards';
import { GraphQLUtils } from '@app/shared/utils';

import { ChronicleService } from './chronicle.service';
import { GetExpensesArgs, ExpenseInput, UpdateExpenseInput } from './dto';
import { Chronicle, Expense, ExpenseConnection, ExpenseOpResult, Metadata } from './entities';

/**
 * Importing and defining types
 */
import type { GraphQLResolveInfo } from 'graphql';

/**
 * Declaring the constants
 */

@UseGuards(AuthGuard)
@Resolver(() => Chronicle)
export class ChronicleResolver {
  constructor(private readonly chronicleService: ChronicleService) {}

  @Query(() => Chronicle, { name: 'chronicle' })
  getChronicle() {
    return {};
  }

  @ResolveField('expense', () => Expense)
  getExpense(@Args('eid') eid: string) {
    return this.chronicleService.findOneExpense(eid);
  }

  @ResolveField('expenses', () => ExpenseConnection)
  async getExpenseConnection(@Info() info: GraphQLResolveInfo, @Args() args: GetExpensesArgs) {
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

  @ResolveField('metadata', () => Metadata)
  async getMetadata() {
    const metadata = await this.chronicleService.getUserMetadata();
    return metadata || {};
  }

  @Mutation(() => ExpenseOpResult)
  async addExpense(@Args('input') input: ExpenseInput) {
    try {
      return await this.chronicleService.addExpense(input);
    } catch (err) {
      return AppError.formatError(err);
    }
  }

  @Mutation(() => ExpenseOpResult)
  async updateExpense(@Args('eid') eid: string, @Args('update') update: UpdateExpenseInput) {
    try {
      return await this.chronicleService.updateExpense(eid, update);
    } catch (err) {
      return AppError.formatError(err);
    }
  }

  @Mutation(() => ExpenseOpResult)
  async removeExpense(@Args('eid') eid: string) {
    try {
      return await this.chronicleService.removeExpense(eid);
    } catch (err) {
      return AppError.formatError(err);
    }
  }
}
