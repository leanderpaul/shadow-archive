/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { DatabaseService } from '@app/providers/database';
import { AppError, ErrorCode } from '@app/shared/errors';
import { type Projection } from '@app/shared/utils';

import { type SleepInput } from './dto/common.args';

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

  constructor(private readonly contextService: ContextService, databaseService: DatabaseService) {
    this.memoirModel = databaseService.getMemoirModel();
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
}
