/**
 * Importing npm packages
 */
import { Resolver, Query, Mutation, Args, Info } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { PageInput } from '@app/graphql/common';
import { GraphQLUtils } from '@app/shared/utils';

import { AddExpenseInput, GetExpensesArgs, UpdateExpenseInput } from './expense.dto';
import { Expense, ExpenseConnection } from './expense.entity';
import { ExpenseService } from './expense.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
export class ExpenseResolver {
  constructor(private readonly expenseService: ExpenseService) {}

  @Query(() => Expense, { name: 'expense' })
  getExpense(@Info() info: GraphQLResolveInfo, @Args('eid') eid: string) {
    const projection = GraphQLUtils.getProjection<Expense>(info);
    return this.expenseService.findOneExpense(eid, projection);
  }

  @Query(() => ExpenseConnection, { name: 'expenses' })
  async getExpenseConnection(@Info() info: GraphQLResolveInfo, @Args() args: GetExpensesArgs) {
    /** Validations */
    PageInput.isValid(args.page);

    const promises = [] as Promise<unknown>[];
    const result = {} as Partial<ExpenseConnection>;
    const projection = GraphQLUtils.getProjection<ExpenseConnection>(info);

    if (projection.items) {
      const promise = this.expenseService.findExpenses(projection.items, args.sort, args.page, args.query);
      promise.then(items => (result.items = items));
      promises.push(promise);
    }

    if (projection.page || projection.totalCount) {
      const promise = this.expenseService.getTotalExpenses(args.query);
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
    return await this.expenseService.addExpense(input);
  }

  @Mutation(() => Expense)
  async updateExpense(@Args('eid') eid: string, @Args('update') update: UpdateExpenseInput) {
    return await this.expenseService.updateExpense(eid, update);
  }

  @Mutation(() => Expense)
  async removeExpense(@Args('eid') eid: string) {
    return await this.expenseService.removeExpense(eid);
  }
}
