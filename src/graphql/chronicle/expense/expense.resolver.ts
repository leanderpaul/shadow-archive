/**
 * Importing npm packages
 */
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
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
    return this.expenseService.getExpense(eid, projection);
  }

  @Query(() => ExpenseConnection, { name: 'expenses' })
  async getExpenseConnection(@Info() info: GraphQLResolveInfo, @Args() args: GetExpensesArgs) {
    return GraphQLUtils.getPaginationResult(info, args.page, {
      getCount: () => this.expenseService.getTotalExpenses(args.query),
      getItems: projection => this.expenseService.findExpenses(projection, args.sort, args.page, args.query),
    });
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
