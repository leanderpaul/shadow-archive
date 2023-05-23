/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { type Projection } from '@app/graphql/common';
import { DatabaseService, type Memoir } from '@app/modules/database';
import { AppError, ErrorCode, NeverError } from '@app/shared/errors';
import { Context } from '@app/shared/services';

import { type SleepInput } from './dto/common.args';
import { Activity, Exercise, Food, type Sleep } from './memoir.entity';

/**
 * Defining types
 */

type FieldName = 'foods' | 'activities' | 'exercises' | 'diary' | 'events';

/**
 * Declaring the constants
 */

@Injectable()
export class MemoirService {
  private readonly memoirModel;

  constructor(databaseService: DatabaseService) {
    this.memoirModel = databaseService.getMemoirModel();
  }

  async getMemoir(date: number, projection?: Projection<any>): Promise<Memoir | null> {
    if (date < 230101 || date > 991232) return null;
    const user = Context.getCurrentUser(true);
    return await this.memoirModel.findOne({ uid: user._id, date }, projection).lean();
  }

  private precheckDate(date: number): void {
    if (date < 230101 || date > 991232) throw new AppError(ErrorCode.R001);
  }

  async updateMemoirSleep(date: number, sleep: SleepInput): Promise<Sleep> {
    this.precheckDate(date);
    const user = Context.getCurrentUser(true);
    const update: Record<string, number | undefined> = { 'sleep.wakeup': sleep.wakeup, 'sleep.bedtime': sleep.bedtime };
    if (sleep.wakeup) {
      const prevDate = moment(date.toString(), 'YYMMDD').subtract(1, 'day').format('YYMMDD');
      const prevMemoir = await this.memoirModel.findOne({ uid: user._id, date: parseInt(prevDate) }, { sleep: 1 }).lean();
      if (prevMemoir?.sleep?.bedtime) update['sleep.duration'] = 2400 + sleep.wakeup - prevMemoir.sleep.bedtime;
    }
    const memoir = await this.memoirModel.findOneAndUpdate({ uid: user._id, date }, { $set: update }, { upsert: true }).lean();
    if (!memoir) throw new NeverError('memoir not found');
    if (!memoir.sleep) throw new NeverError('sleep not found');
    return memoir.sleep;
  }

  async addMemoirField<T extends Exercise | Food | Activity | string>(date: number, fieldName: FieldName, value: T): Promise<T> {
    this.precheckDate(date);
    const user = Context.getCurrentUser(true);
    await this.memoirModel.updateOne({ uid: user._id, date }, { $push: { [fieldName]: value } }, { upsert: true });
    return value;
  }

  async updateMemoirField(date: number, fieldName: FieldName, index: number, value: string): Promise<string>;
  async updateMemoirField<T extends Exercise | Food | Activity>(date: number, fieldName: FieldName, index: number, value: Partial<T>): Promise<T>;
  async updateMemoirField<T extends Exercise | Food | Activity | string>(date: number, fieldName: FieldName, index: number, value: T | Partial<T>): Promise<T> {
    this.precheckDate(date);
    const user = Context.getCurrentUser(true);
    const memoir = await this.memoirModel.findOne({ uid: user._id, date, [`${fieldName}.${index}`]: { $exists: true } }, { date: 1 }).lean();
    if (!memoir) throw new AppError(ErrorCode.R001);
    const updatedMemoir = await this.memoirModel.findOneAndUpdate({ uid: user._id, date }, { $set: { [`${fieldName}.${index}`]: value } }).lean();
    if (!updatedMemoir) throw new NeverError('updated memoir not found');
    const updatedValue = updatedMemoir[fieldName]?.[index];
    if (!updatedValue) throw new NeverError(`updated memoir path '${fieldName}.${index}' not found`);
    return updatedValue as T;
  }

  async deleteMemoirField<T extends Exercise | Food | Activity | string>(date: number, fieldName: FieldName, index: number): Promise<T> {
    this.precheckDate(date);
    const user = Context.getCurrentUser(true);
    const memoir = await this.memoirModel.findOne({ uid: user._id, date, [`${fieldName}.${index}`]: { $exists: true } }, { [fieldName]: 1 }).lean();
    if (!memoir) throw new AppError(ErrorCode.R001);
    const value = (memoir[fieldName] as any[]).filter((_, i) => i != index);
    await this.memoirModel.updateOne({ uid: user._id, date }, { $set: { [fieldName]: value } });
    const deletedValue = (memoir[fieldName] as any[])[index];
    return deletedValue;
  }
}
