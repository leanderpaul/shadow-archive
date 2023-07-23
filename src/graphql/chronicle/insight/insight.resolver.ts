/**
 * Importing npm packages
 */
import { Args, Info, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */

import { GraphQLService } from '@app/graphql/common';
import { ExpenseInsightService } from '@app/modules/chronicle';
import { UseAuthGuard } from '@app/shared/decorators';

import { ExpenseInsightFilter, InsightFilter } from './insight.dto';
import { ExpenseInsight, Insight } from './insight.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver(() => Insight)
@UseAuthGuard()
export class InsightResolver {
  constructor(private readonly expenseInsightService: ExpenseInsightService, private readonly graphqlService: GraphQLService) {}

  @Query(() => Insight, { name: 'insight' })
  getInsight(@Args() args: InsightFilter): InsightFilter {
    InsightFilter.validate(args);
    return args;
  }

  @ResolveField('expense', () => ExpenseInsight)
  async getExpenseInsight(@Parent() parentArgs: InsightFilter, @Args() args: ExpenseInsightFilter, @Info() info: GraphQLResolveInfo): Promise<ExpenseInsight> {
    const filter = { ...parentArgs, ...args };
    const promises: Promise<any>[] = [];
    let result = {} as ExpenseInsight;

    const projection = this.graphqlService.getProjection<ExpenseInsight>(info);
    if (projection.billCount || projection.total) {
      const promise = this.expenseInsightService.getTotalExpenses(filter).then(res => (result = { ...result, ...res }));
      promises.push(promise);
    }
    if (projection.categories) {
      const promise = this.expenseInsightService.getTotalExpensesGroupedByCategory(filter).then(res => (result.categories = res));
      promises.push(promise);
    }

    await Promise.all(promises);
    return result;
  }
}
