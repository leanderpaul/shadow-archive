/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { Expense, DBUtils, ContextService, ChronicleMetadata, Logger, Memoir } from '@app/providers';
import { AppError, ErrorCode } from '@app/shared/errors';

/**
 * Importing and defining types
 */
import type { PageInput } from '@app/graphql/common';
import type { ExpenseModel, ChronicleMetadataModel, MemoirModel } from '@app/providers';
import type { Projection } from '@app/shared/utils';

import type { ExpenseQuery, ExpenseSort, ExpenseItemInput, AddExpenseInput, UpdateExpenseInput, SleepInput } from './dto';

type FieldName = 'foods' | 'activities' | 'exercises' | 'diary' | 'events';

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('chronicle.service');
const removeableFields = ['bid', 'time', 'storeLoc', 'pm', 'desc'] as const;

@Injectable()
export class ChronicleService {
  constructor(
    private readonly contextService: ContextService,
    @InjectModel(ChronicleMetadata.name) private readonly metadata: ChronicleMetadataModel,
    @InjectModel(Expense.name) private readonly expenseModel: ExpenseModel,
    @InjectModel(Memoir.name) private readonly memoirModel: MemoirModel,
  ) {}

  private calculateTotal(items: ExpenseItemInput[]) {
    return items.reduce((acc, item) => acc + Math.round(item.price * item.qty), 0);
  }

  findOneExpense<T extends object>(eid: string, projection?: Projection<T>) {
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
    if (!expense) throw new AppError(ErrorCode.R001);
    return expense;
  }

  async removeExpense(eid: string) {
    const id = DBUtils.toObjectID(eid, true);
    const user = this.contextService.getCurrentUser(true);
    const expense = await this.expenseModel.findOneAndDelete({ uid: user._id, _id: id }).lean();
    if (!expense) throw new AppError(ErrorCode.R001);
    await this.metadata.updateOne({ uid: user._id }, { $inc: { billCount: -1 } });
    return expense;
  }

  async getMemoir(date: number, projection?: Projection<any>) {
    if (date < 230101 || date > 991232) return null;
    const user = this.contextService.getCurrentUser(true);
    return await this.memoirModel.findOne({ uid: user._id, date }, projection).lean();
  }

  private precheckDate(date: number) {
    if (date < 230101 || date > 991232) throw new AppError(ErrorCode.R001);
  }

  async updateMemoirSleep(date: number, sleep: SleepInput) {
    this.precheckDate(date);
    const user = this.contextService.getCurrentUser(true);
    const update: Record<string, number | undefined> = { 'sleep.wakeup': sleep.wakeup, 'sleep.bedtime': sleep.bedtime };
    if (sleep.wakeup) {
      const prevDate = moment(date.toString(), 'YYMMDD').subtract(1, 'day').format('YYMMDD');
      const prevMemoir = await this.memoirModel.findOne({ uid: user._id, date: parseInt(prevDate) }, { sleep: 1 }).lean();
      if (prevMemoir?.sleep?.bedtime) update['sleep.duration'] = 2400 + sleep.wakeup - prevMemoir.sleep.bedtime;
    }
    return await this.memoirModel.findOneAndUpdate({ uid: user._id, date }, { $set: update }, { upsert: true }).lean();
  }

  async addMemoirField<T>(date: number, fieldName: FieldName, value: T) {
    this.precheckDate(date);
    const user = this.contextService.getCurrentUser(true);
    await this.memoirModel.updateOne({ uid: user._id, date }, { $push: { [fieldName]: value } }, { upsert: true });
    return typeof value === 'string' ? { value } : value;
  }

  async updateMemoirField<T>(date: number, fieldName: FieldName, index: number, value: T) {
    this.precheckDate(date);
    const user = this.contextService.getCurrentUser(true);
    const memoir = await this.memoirModel.findOne({ uid: user._id, date, [`${fieldName}.${index}`]: { $exists: true } }, { date: 1 }).lean();
    if (!memoir) throw new AppError(ErrorCode.R001);
    await this.memoirModel.updateOne({ uid: user._id, date }, { $set: { [`${fieldName}.${index}`]: value } });
    return typeof value === 'string' ? { value } : value;
  }

  async deleteMemoirField(date: number, fieldName: FieldName, index: number) {
    this.precheckDate(date);
    const user = this.contextService.getCurrentUser(true);
    const memoir = await this.memoirModel.findOne({ uid: user._id, date, [`${fieldName}.${index}`]: { $exists: true } }, { [fieldName]: 1 }).lean();
    if (!memoir) throw new AppError(ErrorCode.R001);
    const value = (memoir[fieldName] as any[]).filter((_, i) => i != index);
    await this.memoirModel.updateOne({ uid: user._id, date }, { $set: { [fieldName]: value } });
    const deletedValue = (memoir[fieldName] as any[])[index];
    return typeof deletedValue === 'string' ? { value: deletedValue } : deletedValue;
  }

  async getUserMetadata() {
    const user = this.contextService.getCurrentUser(true);
    return await this.metadata.findOne({ uid: user._id }).lean();
  }
}
