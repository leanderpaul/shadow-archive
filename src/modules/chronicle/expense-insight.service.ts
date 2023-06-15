/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { Aggregate } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Currency, DatabaseService, ExpenseCategory, type ExpenseVisibiltyLevel } from '@app/modules/database';
import { Context } from '@app/shared/services';

/**
 * Defining types
 */

export interface ExpenseInsightFilter {
  currency: Currency;
  year: number;
  week?: number;
  month?: number;
  levels?: ExpenseVisibiltyLevel[];
}

export interface TotalExpenseAggregationResult {
  _id: Currency;
  total: number;
  billCount: number;
}

export interface CategoryWiseTotalExpenseAggregationResult {
  name: ExpenseCategory;
  total: number;
  billCount: number;
}

type RawCategoryWiseAggregationResult = Omit<TotalExpenseAggregationResult, '_id'> & { _id: number | null };

/**
 * Declaring the constants
 */

@Injectable()
export class ExpenseInsightService {
  private readonly expenseModel;

  constructor(databaseService: DatabaseService) {
    this.expenseModel = databaseService.getExpenseModel();
  }

  private getMatchPipeline<T = any>(filter: ExpenseInsightFilter): Aggregate<T[]> {
    if (!filter.month && !filter.week) filter.month = moment().month() + 1;

    const { uid } = Context.getCurrentUser(true);
    const match: Record<string, any> = { uid, currency: filter.currency };
    if (filter.levels && filter.levels.length > 0) match.level = { $in: filter.levels };
    if (filter.month) {
      const startDate = (filter.year * 100 + filter.month) * 100;
      match.date = { $gte: startDate, $lte: startDate + 31 };
    } else {
      const startDate = moment(`${filter.year}-${filter.week}`, 'YY-WW');
      const endDate = startDate.clone().add(6, 'days');
      match.date = { $gte: parseInt(startDate.format('YYMMDD')), $lte: parseInt(endDate.format('YYMMDD')) };
    }
    return this.expenseModel.aggregate().match(match);
  }

  async getTotalExpenses(filter: ExpenseInsightFilter): Promise<TotalExpenseAggregationResult> {
    const [result] = await this.getMatchPipeline<TotalExpenseAggregationResult>(filter).group({ _id: '$currency', total: { $sum: '$total' }, billCount: { $sum: 1 } });
    return result || { _id: filter.currency, total: 0, billCount: 0 };
  }

  async getTotalExpensesGroupedByCategory(filter: ExpenseInsightFilter): Promise<CategoryWiseTotalExpenseAggregationResult[]> {
    const result = await this.getMatchPipeline<RawCategoryWiseAggregationResult>(filter).group({ _id: '$category', total: { $sum: '$total' }, billCount: { $sum: 1 } });
    return result.map(item => ({ ...item, name: item._id ?? 0 }));
  }
}
