/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { type Activity, DatabaseService, type Exercise, type Food, type Memoir, type Sleep } from '@app/modules/database';
import { AppError, ErrorCode, NeverError } from '@app/shared/errors';
import { type Projection } from '@app/shared/interfaces';
import { Context } from '@app/shared/services';

/**
 * Defining types
 */

interface MemoirFields {
  foods: Food;
  activities: Activity;
  exercises: Exercise;
  diary: string;
  events: string;
}

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
    return await this.memoirModel.findOne({ uid: user.uid, date }, projection).lean();
  }

  private precheckDate(date: number): void {
    if (date < 230101 || date > 991232) throw new AppError(ErrorCode.R001);
  }

  async updateMemoirSleep(date: number, sleep: Partial<Omit<Sleep, 'duration'>>): Promise<Sleep> {
    this.precheckDate(date);
    const user = Context.getCurrentUser(true);
    const update: Record<string, number | undefined> = { 'sleep.wakeup': sleep.wakeup, 'sleep.bedtime': sleep.bedtime };
    if (sleep.wakeup) {
      const prevDate = moment(date.toString(), 'YYMMDD').subtract(1, 'day').format('YYMMDD');
      const prevMemoir = await this.memoirModel.findOne({ uid: user.uid, date: parseInt(prevDate) }, { sleep: 1 }).lean();
      if (prevMemoir?.sleep?.bedtime) update['sleep.duration'] = 2400 + sleep.wakeup - prevMemoir.sleep.bedtime;
    }
    const memoir = await this.memoirModel.findOneAndUpdate({ uid: user.uid, date }, { $set: update }, { upsert: true }).lean();
    if (!memoir) throw new NeverError('memoir not found');
    if (!memoir.sleep) throw new NeverError('sleep not found');
    return memoir.sleep;
  }

  async addMemoirField<T extends keyof MemoirFields>(date: number, fieldName: T, value: MemoirFields[T]): Promise<MemoirFields[T]> {
    this.precheckDate(date);
    const user = Context.getCurrentUser(true);
    await this.memoirModel.updateOne({ uid: user.uid, date }, { $push: { [fieldName]: value } }, { upsert: true });
    return value;
  }

  async updateMemoirField<T extends keyof MemoirFields>(date: number, fieldName: T, index: number, value: MemoirFields[T] | Partial<MemoirFields[T]>): Promise<MemoirFields[T]> {
    this.precheckDate(date);
    const user = Context.getCurrentUser(true);
    const memoir = await this.memoirModel.findOne({ uid: user.uid, date, [`${fieldName}.${index}`]: { $exists: true } }, { date: 1 }).lean();
    if (!memoir) throw new AppError(ErrorCode.R001);
    const updatedMemoir = await this.memoirModel.findOneAndUpdate({ uid: user.uid, date }, { $set: { [`${fieldName}.${index}`]: value } }).lean();
    if (!updatedMemoir) throw new NeverError('updated memoir not found');
    const updatedValue = updatedMemoir[fieldName]?.[index];
    if (!updatedValue) throw new NeverError(`updated memoir path '${fieldName}.${index}' not found`);
    return updatedValue as MemoirFields[T];
  }

  async deleteMemoirField<T extends keyof MemoirFields>(date: number, fieldName: T, index: number): Promise<MemoirFields[T]> {
    this.precheckDate(date);
    const user = Context.getCurrentUser(true);
    const memoir = await this.memoirModel.findOne({ uid: user.uid, date, [`${fieldName}.${index}`]: { $exists: true } }, { [fieldName]: 1 }).lean();
    const deletedValue = memoir?.[fieldName]?.[index];
    if (!deletedValue) throw new AppError(ErrorCode.R001);
    const value = (memoir[fieldName] as any[]).filter((_, i) => i != index);
    await this.memoirModel.updateOne({ uid: user.uid, date }, { $set: { [fieldName]: value } });
    return deletedValue as MemoirFields[T];
  }
}
