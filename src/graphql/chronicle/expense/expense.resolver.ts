/**
 * Importing npm packages
 */
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { ExpenseService } from '@app/modules/chronicle';
import { UseAuthGuard } from '@app/shared/decorators';

import { AddExpenseInput, GetExpenseArgs, SearchExpensesArgs, UpdateExpenseArgs } from './expense.dto';
import { Expense, ExpenseConnection } from './expense.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
@UseAuthGuard()
export class ExpenseResolver {
  constructor(private readonly expenseService: ExpenseService, private readonly graphqlService: GraphQLService) {}

  @Query(() => Expense, { name: 'expense', nullable: true })
  getExpense(@Info() info: GraphQLResolveInfo, @Args() args: GetExpenseArgs): Promise<Expense | null> {
    const projection = this.graphqlService.getProjection<Expense>(info);
    return this.expenseService.getExpense(null, args.eid, projection);
  }

  @Query(() => ExpenseConnection, { name: 'expenses' })
  getExpenseConnection(@Info() info: GraphQLResolveInfo, @Args() args: SearchExpensesArgs): Promise<ExpenseConnection> {
    return this.graphqlService.getPaginationResult<Expense, ExpenseConnection>(info, args.page, {
      getCount: () => this.expenseService.getExpensesCount(null, args.filter),
      getItems: projection => this.expenseService.getExpenseList(null, args, projection),
    });
  }

  @Mutation(() => Expense)
  addExpense(@Args('input') input: AddExpenseInput): Promise<Expense> {
    return this.expenseService.addExpense(null, input);
  }

  @Mutation(() => Expense)
  updateExpense(@Args() args: UpdateExpenseArgs): Promise<Expense> {
    return this.expenseService.updateExpense(null, args.eid, args.update);
  }

  @Mutation(() => Expense)
  removeExpense(@Args() args: GetExpenseArgs): Promise<Expense> {
    return this.expenseService.removeExpense(null, args.eid);
  }
}
