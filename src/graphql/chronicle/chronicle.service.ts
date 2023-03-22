/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { Expense, DBUtils, ContextService, ChronicleMetadata, Logger } from '@app/providers';
import { AppError } from '@app/shared/errors';

/**
 * Importing and defining types
 */
import type { PageInput } from '@app/graphql/common';
import type { ExpenseModel, ChronicleMetadataModel } from '@app/providers';
import type { Projection } from '@app/shared/utils';

import type { ExpenseQuery, ExpenseSort, ExpenseItemInput, ExpenseInput, UpdateExpenseInput } from './dto';

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('chronicle.service');
const removeableFields = ['bid', 'time', 'storeLoc', 'pm', 'desc'] as const;

@Injectable()
export class ChronicleService {
  constructor(
    @InjectModel(ChronicleMetadata.name) private metadata: ChronicleMetadataModel,
    @InjectModel(Expense.name) private expenseModel: ExpenseModel,
    private contextService: ContextService,
  ) {}

  private calculateTotal(items: ExpenseItemInput[]) {
    return items.reduce((acc, item) => acc + Math.round(item.price * item.qty), 0);
  }

  findOneExpense(eid: string) {
    const user = this.contextService.getCurrentUser(true);
    const id = DBUtils.toObjectID(eid);
    if (!id) return null;
    return this.expenseModel.findOne({ _id: id, uid: user._id }).lean();
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
    return await this.getExpensesQuery(query)
      .sort({ [sort.field]: sort.order })
      .skip(page.offset)
      .limit(page.limit)
      .lean();
  }

  async getTotalExpenses(query?: ExpenseQuery) {
    return await this.getExpensesQuery(query).countDocuments();
  }

  getFindExpensesQuery(sort: ExpenseSort, page: PageInput, query?: ExpenseQuery) {
    const user = this.contextService.getCurrentUser(true);
    const expenseQuery = this.expenseModel
      .find({ uid: user._id })
      .sort({ [sort.field]: sort.order })
      .skip(page.offset)
      .limit(page.limit);

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

  async addExpense(input: ExpenseInput) {
    const total = this.calculateTotal(input.items);
    const user = this.contextService.getCurrentUser(true);
    const expense = await this.expenseModel.create({ uid: user._id, ...input, total });

    this.metadata
      .updateOne({ uid: user._id }, { $inc: { expenseCount: 1 }, $addToSet: { pms: input.pm } })
      .then(result => (result.modifiedCount === 0 ? this.metadata.create({ uid: user._id, expenseCount: 1, pms: input.pm ? [input.pm] : [] }) : null))
      .catch(err => logger.error(err));

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
    if (!expense) throw AppError.NotFound();
    return expense;
  }

  async removeExpense(eid: string) {
    const id = DBUtils.toObjectID(eid, true);
    const user = this.contextService.getCurrentUser(true);
    const expense = await this.expenseModel.findOneAndDelete({ uid: user._id, _id: id }).lean();
    if (!expense) throw AppError.NotFound();
    await this.metadata.updateOne({ uid: user._id }, { $inc: { billCount: -1 } });
    return expense;
  }

  async getUserMetadata() {
    const user = this.contextService.getCurrentUser(true);
    return await this.metadata.findOne({ uid: user._id }).lean();
  }
}
