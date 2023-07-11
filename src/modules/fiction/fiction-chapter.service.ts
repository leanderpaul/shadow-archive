/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { type SortOrder } from 'mongoose';

/**
 * Importing user defined packages
 */
import { DatabaseService, type FictionChapter, type ID } from '@app/modules/database';
import { Logger } from '@app/providers/logger';
import { AppError, ErrorCode, NeverError, ValidationError } from '@app/shared/errors';
import { type PageCursor, type Projection } from '@app/shared/interfaces';

import { FictionService } from './fiction.service';

/**
 * Defining types
 */

export type ChapterInput = Pick<FictionChapter, 'name' | 'matureContent' | 'content'> & { index?: number };

/**
 * Declaring the constants
 */

export interface ChapterQuery {
  sortOrder: SortOrder;
  page?: Partial<PageCursor>;
}

@Injectable()
export class FictionChapterService {
  private readonly logger = Logger.getLogger(FictionChapterService.name);
  private readonly fictionModel;
  private readonly fictionChapterModel;

  constructor(databaseService: DatabaseService, private readonly fictionService: FictionService) {
    this.fictionModel = databaseService.getFictionModel();
    this.fictionChapterModel = databaseService.getFictionChapterModel();
  }

  async addChapter(fid: ID, input: ChapterInput): Promise<FictionChapter> {
    const fiction = await this.fictionService.getFiction(fid, ['chapterCount', 'name']);
    if (!fiction) throw new AppError(ErrorCode.R001);
    fid = fiction.fid;
    if (input.index && input.index > fiction.chapterCount) throw new ValidationError('index', 'should be less than or equal to the total number of chapters in the fiction');
    if (input.index) await this.fictionChapterModel.updateMany({ fid, index: { $gte: input.index } }, { $inc: { index: 1 } });
    const index = input.index ?? fiction.chapterCount + 1;
    const chapter = await this.fictionChapterModel.create({ ...input, fid, index });
    this.fictionModel
      .updateOne({ fid }, { $inc: { chapterCount: 1 }, $set: { updatedAt: new Date() } })
      .catch(err => this.logger.error(err, { msg: `Error while adding chapter '${index}' to novel '${fiction.name}'` }));
    return chapter;
  }

  async getChapter<T extends keyof FictionChapter>(fid: ID, index: number, projection?: T[]): Promise<Pick<FictionChapter, T> | null>;
  async getChapter(fid: ID, index: number, projection?: Projection<FictionChapter>): Promise<FictionChapter | null>;
  async getChapter<T>(fid: ID, index: number, projection?: Projection<FictionChapter> | T[]): Promise<FictionChapter | null> {
    return await this.fictionChapterModel.findOne({ fid, index }, projection).lean();
  }

  async listChapter<T extends keyof FictionChapter>(fid: ID, query: ChapterQuery, projection?: T[]): Promise<Pick<FictionChapter, T>[]>;
  async listChapter(fid: ID, query: ChapterQuery, projection?: Projection<FictionChapter>): Promise<FictionChapter[]>;
  async listChapter<T>(fid: ID, query: ChapterQuery, projection?: Projection<FictionChapter> | T[]): Promise<FictionChapter[]> {
    const findQuery = this.fictionChapterModel.find({ fid }, projection).sort({ index: query.sortOrder });
    if (query.page?.limit) findQuery.limit(query.page.limit);
    if (query.page?.offset) findQuery.skip(query.page.offset);
    return await findQuery.lean();
  }

  async updateChapter(fid: ID, index: number, update: Partial<ChapterInput>): Promise<FictionChapter> {
    const chapter = await this.fictionChapterModel.findOneAndUpdate({ fid, index }, { $set: update }).lean();
    if (!chapter) throw new AppError(ErrorCode.R001);
    return chapter;
  }

  async deleteChapter(fid: ID, index: number): Promise<FictionChapter> {
    const chapter = await this.fictionChapterModel.findOneAndDelete({ fid, index }).lean();
    if (!chapter) throw new AppError(ErrorCode.R001);
    const fiction = await this.fictionModel.findOneAndUpdate({ fid }, { $inc: { chapterCount: -1 } });
    if (!fiction) throw new NeverError('Fiction not found');
    if (fiction.chapterCount >= chapter.index) {
      this.fictionChapterModel
        .updateMany({ fid, index: { $gte: chapter.index } }, { $inc: { index: -1 } })
        .catch(err => this.logger.error(err, { msg: `Error while deleting chapter '${index}' from novel '${fiction.name}'` }));
    }
    return chapter;
  }
}
