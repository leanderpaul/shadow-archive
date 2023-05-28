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
import { AuthType, UseAuth } from '@app/shared/decorators';

import { AddExpenseInput, GetExpensesArgs, UpdateExpenseInput } from './expense.dto';
import { Expense, ExpenseConnection } from './expense.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
@UseAuth(AuthType.VERIFIED)
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
      getCount: () => this.expenseService.getExpensesCount(args.filter),
      getItems: projection => this.expenseService.getExpenseList(args, projection),
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
