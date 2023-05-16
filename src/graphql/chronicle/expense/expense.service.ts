/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { type PageInput } from '@app/graphql/common';
import { ContextService } from '@app/providers/context';
import { DBUtils, DatabaseService } from '@app/providers/database';
import { Logger } from '@app/providers/logger';
import { AppError, ErrorCode } from '@app/shared/errors';
import { type Projection } from '@app/shared/utils';

import { AddExpenseInput, ExpenseItemInput, ExpenseQuery, ExpenseSort, UpdateExpenseInput } from './expense.dto';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('expense:service');
const removeableFields = ['bid', 'time', 'storeLoc', 'pm', 'desc'] as const;

@Injectable()
export class ExpenseService {
  private readonly expenseModel;
  private readonly userModel;

  constructor(private readonly contextService: ContextService, databaseService: DatabaseService) {
    this.expenseModel = databaseService.getExpenseModel();
    this.userModel = databaseService.getUserModel();
  }

  private calculateTotal(items: ExpenseItemInput[]) {
    return items.reduce((acc, item) => acc + Math.round(item.price * item.qty), 0);
  }

  getExpense<T extends object>(eid: string, projection?: Projection<T>) {
    const user = this.contextService.getCurrentUser(true);
    const id = DBUtils.toObjectID(eid);
    if (!id) return null;
    return this.expenseModel.findOne({ _id: id, uid: user._id }, projection).lean();
  }

  private getExpensesQuery(query?: ExpenseQuery, projection?: Projection<any>) {
    const user = this.contextService.getCurrentUser(true);
    const expenseQuery = this.expenseModel.find({ uid: user._id }, projection);

    if (query) {
      const { currency, date, pm, store, total } = query;

      if (currency) expenseQuery.where('currency', currency);

      if (pm) expenseQuery.regex('pm', new RegExp(pm, 'ig'));
      if (store) expenseQuery.regex('store', new RegExp(store, 'ig'));

      if (date?.min) expenseQuery.where('date').gte(date.min);
      if (date?.max) expenseQuery.where('date').lte(date.max);
      if (date?.eq) expenseQuery.where('date', date.eq);

      if (total?.min) expenseQuery.where('total').gte(total.min);
      if (total?.max) expenseQuery.where('total').lte(total.max);
      if (total?.eq) expenseQuery.where('total', total.eq);
    }

    return expenseQuery;
  }

  async findExpenses<T extends object>(projection: Projection<T>, sort: ExpenseSort, page: PageInput, query?: ExpenseQuery) {
    return await this.getExpensesQuery(query, projection)
      .sort({ [sort.field]: sort.order })
      .skip(page.offset)
      .limit(page.limit)
      .lean();
  }

  async getTotalExpenses(query?: ExpenseQuery) {
    return await this.getExpensesQuery(query).countDocuments();
  }

  async addExpense(input: AddExpenseInput) {
    const total = this.calculateTotal(input.items);
    const user = this.contextService.getCurrentUser(true);
    const expense = await this.expenseModel.create({ uid: user._id, ...input, total });

    this.userModel.updateOne({ _id: user._id }, { $inc: { 'chronicle.expenseCount': 1 }, $addToSet: { 'chronicle.pms': input.pm } }).catch(err => logger.error(err));

    return expense;
  }

  async updateExpense(eid: string, update: UpdateExpenseInput) {
    const id = DBUtils.toObjectID(eid, true);
    const user = this.contextService.getCurrentUser(true);
    const query = this.expenseModel.findOneAndUpdate({ uid: user._id, _id: id }, {});

    if (update.items) query.set('total', this.calculateTotal(update.items));
    for (const field of removeableFields) {
      const value = update[field];
      if (value === undefined) continue;
      if ((typeof value === 'number' && value < 0) || (typeof value === 'string' && value.trim() === '')) query.unset(field);
      else query.set(field, value);
      delete update[field];
    }
    query.set(update as any);

    const expense = await query.lean();
    if (!expense) throw new AppError(ErrorCode.R001);
    return expense;
  }

  async removeExpense(eid: string) {
    const id = DBUtils.toObjectID(eid, true);
    const user = this.contextService.getCurrentUser(true);
    const expense = await this.expenseModel.findOneAndDelete({ uid: user._id, _id: id }).lean();
    if (!expense) throw new AppError(ErrorCode.R001);
    await this.userModel.updateOne({ _id: user._id }, { $inc: { 'chronicle.expenseCount': -1 } });
    return expense;
  }
}
