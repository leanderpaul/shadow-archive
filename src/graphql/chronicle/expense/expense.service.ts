/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { type QueryWithHelpers } from 'mongoose';

/**
 * Importing user defined packages
 */
import { type PageInput, type Projection } from '@app/graphql/common';
import { DBUtils, DatabaseService, type Expense } from '@app/modules/database';
import { Logger } from '@app/providers/logger';
import { AppError, ErrorCode } from '@app/shared/errors';
import { Context } from '@app/shared/services';

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

  constructor(databaseService: DatabaseService) {
    this.expenseModel = databaseService.getExpenseModel();
    this.userModel = databaseService.getUserModel();
  }

  private calculateTotal(items: ExpenseItemInput[]): number {
    return items.reduce((acc, item) => acc + Math.round(item.price * item.qty), 0);
  }

  async getExpense<T extends object>(eid: string, projection?: Projection<T>): Promise<Expense | null> {
    const user = Context.getCurrentUser(true);
    const id = DBUtils.toObjectID(eid);
    if (!id) return null;
    return this.expenseModel.findOne({ _id: id, uid: user._id }, projection).lean();
  }

  private getExpensesQuery(query?: ExpenseQuery, projection?: Projection<any>): QueryWithHelpers<Expense[], Expense> {
    const user = Context.getCurrentUser(true);
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

  async findExpenses<T extends object>(projection: Projection<T>, sort: ExpenseSort, page: PageInput, query?: ExpenseQuery): Promise<Expense[]> {
    return await this.getExpensesQuery(query, projection)
      .sort({ [sort.field]: sort.order })
      .skip(page.offset)
      .limit(page.limit)
      .lean();
  }

  async getTotalExpenses(query?: ExpenseQuery): Promise<number> {
    return await this.getExpensesQuery(query).countDocuments();
  }

  async addExpense(input: AddExpenseInput): Promise<Expense> {
    const total = this.calculateTotal(input.items);
    const user = Context.getCurrentUser(true);
    const expense = await this.expenseModel.create({ uid: user._id, ...input, total });

    this.userModel.updateOne({ _id: user._id }, { $inc: { 'chronicle.expenseCount': 1 }, $addToSet: { 'chronicle.pms': input.pm } }).catch(err => logger.error(err));

    return expense;
  }

  async updateExpense(eid: string, update: UpdateExpenseInput): Promise<Expense> {
    const id = DBUtils.toObjectID(eid, true);
    const user = Context.getCurrentUser(true);
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

  async removeExpense(eid: string): Promise<Expense> {
    const id = DBUtils.toObjectID(eid, true);
    const user = Context.getCurrentUser(true);
    const expense = await this.expenseModel.findOneAndDelete({ uid: user._id, _id: id }).lean();
    if (!expense) throw new AppError(ErrorCode.R001);
    await this.userModel.updateOne({ _id: user._id }, { $inc: { 'chronicle.expenseCount': -1 } });
    return expense;
  }
}
