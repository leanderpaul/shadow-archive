/**
 * Importing npm packages
 */
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';

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
  constructor(private readonly expenseService: ExpenseService, private readonly graphqlService: GraphQLService) {}

  @Query(() => Expense, { name: 'expense', nullable: true })
  getExpense(@Info() info: GraphQLResolveInfo, @Args('eid') eid: string): Promise<Expense | null> {
    const projection = this.graphqlService.getProjection<Expense>(info);
    return this.expenseService.getExpense(eid, projection);
  }

  @Query(() => ExpenseConnection, { name: 'expenses' })
  getExpenseConnection(@Info() info: GraphQLResolveInfo, @Args() args: GetExpensesArgs): Promise<ExpenseConnection> {
    return this.graphqlService.getPaginationResult<Expense, ExpenseConnection>(info, args.page, {
      getCount: () => this.expenseService.getTotalExpenses(args.query),
      getItems: projection => this.expenseService.findExpenses(projection, args.sort, args.page, args.query),
    });
  }

  @Mutation(() => Expense)
  addExpense(@Args('input') input: AddExpenseInput): Promise<Expense> {
    return this.expenseService.addExpense(input);
  }

  @Mutation(() => Expense)
  updateExpense(@Args('eid') eid: string, @Args('update') update: UpdateExpenseInput): Promise<Expense> {
    return this.expenseService.updateExpense(eid, update);
  }

  @Mutation(() => Expense)
  removeExpense(@Args('eid') eid: string): Promise<Expense> {
    return this.expenseService.removeExpense(eid);
  }
}
