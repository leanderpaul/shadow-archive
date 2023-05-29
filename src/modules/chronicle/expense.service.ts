/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { type QueryWithHelpers, type SortOrder } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Currency, DBUtils, DatabaseService, type Expense, type ExpenseItem, type ID } from '@app/modules/database';
import { AppError, ErrorCode } from '@app/shared/errors';
import { type Projection } from '@app/shared/interfaces';
import { Context } from '@app/shared/services';

/**
 * Defining types
 */

export interface ExpenseFilter {
  store?: string;
  fromDate?: number;
  toDate?: number;
  currency?: Currency;
  paymentMethod?: string;
  levels?: number[];
}

export interface ExpenseQuery {
  filter?: ExpenseFilter;
  sortOrder: SortOrder;
  page: {
    limit: number;
    offset: number;
  };
}

/**
 * Declaring the constants
 */
const removeableFields = ['bid', 'time', 'storeLoc', 'paymentMethod', 'desc'] as const;

@Injectable()
export class ExpenseService {
  private readonly expenseModel;
  private readonly userModel;

  constructor(databaseService: DatabaseService) {
    this.expenseModel = databaseService.getExpenseModel();
    this.userModel = databaseService.getUserModel();
  }

  private calculateTotal(items: ExpenseItem[]): number {
    const total = items.reduce((acc, item) => acc + parseFloat((item.price * (item.qty ?? 1)).toFixed(2)), 0);
    return parseFloat(total.toFixed(2));
  }

  private getExpensesQuery<T extends keyof Omit<Expense, 'uid' | 'eid'>>(query?: ExpenseFilter, projection?: T[]): QueryWithHelpers<Expense[], Expense>;
  private getExpensesQuery(query?: ExpenseFilter, projection?: Projection<Expense>): QueryWithHelpers<Expense[], Expense>;
  private getExpensesQuery<T>(query?: ExpenseFilter, projection?: Projection<Expense> | T[]): QueryWithHelpers<Expense[], Expense> {
    const { uid } = Context.getCurrentUser(true);
    const expenseQuery = this.expenseModel.find({ uid }, projection);
    if (query?.currency) expenseQuery.where('currency', query.currency);
    if (query?.paymentMethod) expenseQuery.regex('paymentMethod', new RegExp(query.paymentMethod, 'ig'));
    if (query?.store) expenseQuery.regex('store', new RegExp(query.store, 'ig'));
    if (query?.fromDate) expenseQuery.where('date').gte(query.fromDate);
    if (query?.toDate) expenseQuery.where('date').lte(query.toDate);
    if (query?.levels) expenseQuery.where('level').in(query.levels);
    return expenseQuery;
  }

  async getExpense<T extends keyof Omit<Expense, 'uid' | 'eid'>>(eid: ID, projection?: T[]): Promise<Pick<Expense, 'uid' | 'eid' | T> | null>;
  async getExpense(eid: ID, projection?: Projection<Expense>): Promise<Expense | null>;
  async getExpense<T>(eid: ID, projection?: Projection<Expense> | T[]): Promise<Expense | null> {
    const { uid } = Context.getCurrentUser(true);
    if (typeof eid === 'string') {
      const id = DBUtils.toObjectID(eid);
      if (!id) return null;
      eid = id;
    }
    return await this.expenseModel.findOne({ uid, eid }, projection).lean();
  }

  async getExpenseList<T extends keyof Omit<Expense, 'uid' | 'eid'>>(query: ExpenseQuery, projection?: T[]): Promise<Pick<Expense, 'uid' | 'eid' | T>[]>;
  async getExpenseList(query: ExpenseQuery, projection?: Projection<Expense>): Promise<Expense[]>;
  async getExpenseList<T>(query: ExpenseQuery, projection?: Projection<Expense> | T[]): Promise<Expense[]> {
    return await this.getExpensesQuery(query.filter, projection as any)
      .sort({ date: query.sortOrder })
      .skip(query.page.offset)
      .limit(query.page.limit)
      .lean();
  }

  async getExpensesCount(filter?: ExpenseFilter): Promise<number> {
    return await this.getExpensesQuery(filter).countDocuments();
  }

  async addExpense(input: Omit<Expense, 'eid' | 'uid' | 'total'>): Promise<Expense> {
    const { uid } = Context.getCurrentUser(true);
    const total = this.calculateTotal(input.items);
    const expense = await this.expenseModel.create({ uid, ...input, total });
    this.userModel
      .updateOne({ uid }, { $inc: { 'chronicle.expenseCount': 1, 'chronicle.deviation': input.level * total }, $addToSet: { 'chronicle.paymentMethods': input.paymentMethod } })
      .then();
    return expense;
  }

  async updateExpense(eid: ID, update: Partial<Omit<Expense, 'eid' | 'uid' | 'total'>>): Promise<Expense> {
    if (typeof eid === 'string') eid = DBUtils.toObjectID(eid, true);
    const { uid } = Context.getCurrentUser(true);
    const query = this.expenseModel.findOneAndUpdate({ uid, eid }, {});

    if (update.items) query.set('total', this.calculateTotal(update.items));
    for (const field of removeableFields) {
      const value = update[field];
      if (value === undefined) continue;
      if (typeof value === 'string' && value.trim() === '') query.unset(field);
      else query.set(field, value);
      delete update[field];
    }
    query.set(update);

    const expense = await query.lean();
    if (!expense) throw new AppError(ErrorCode.R001);
    return expense;
  }

  async removeExpense(eid: ID): Promise<Expense> {
    if (typeof eid === 'string') eid = DBUtils.toObjectID(eid, true);
    const { uid } = Context.getCurrentUser(true);
    const expense = await this.expenseModel.findOneAndDelete({ uid, eid }).lean();
    if (!expense) throw new AppError(ErrorCode.R001);
    await this.userModel.updateOne({ uid }, { $inc: { 'chronicle.expenseCount': -1, 'chronicle.deviation': expense.level * expense.total * -1 } });
    return expense;
  }
}
