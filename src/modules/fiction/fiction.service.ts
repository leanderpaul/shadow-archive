/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { type QueryWithHelpers } from 'mongoose';

/**
 * Importing user defined packages
 */
import { DBUtils, DatabaseService, type Fiction, FictionGenre, FictionStatus, FictionType, type ID } from '@app/modules/database';
import { Logger } from '@app/providers/logger';
import { AppError, ErrorCode } from '@app/shared/errors';
import { type PageCursor, type PageSort, type Projection } from '@app/shared/interfaces';

/**
 * Defining types
 */

export type FictionInput = Omit<Fiction, 'fid' | 'views' | 'chapterCount' | 'createdAt' | 'updatedAt' | 'status' | 'sources'> &
  Partial<Pick<Fiction, 'status' | 'sources' | 'updatedAt'>>;

export interface FictionFilter {
  title?: string;
  type?: FictionType;
  status?: FictionStatus;
  genre?: FictionGenre;
  tag?: string;
  author?: string;
}

export interface FictionQuery {
  filter?: FictionFilter;
  sort: PageSort<'title' | 'updatedAt' | 'createdAt' | 'views' | 'chapterCount'>;
  page: PageCursor;
}

/**
 * Declaring the constants
 */

@Injectable()
export class FictionService {
  private readonly logger = Logger.getLogger(FictionService.name);
  private readonly fictionModel;
  private readonly fictionChapterModel;

  constructor(databaseService: DatabaseService) {
    this.fictionModel = databaseService.getFictionModel();
    this.fictionChapterModel = databaseService.getFictionChapterModel();
  }

  private getFictionsQuery<T>(filter?: FictionFilter, projection?: Projection<Fiction> | T[]): QueryWithHelpers<Fiction[], Fiction> {
    const fictionQuery = this.fictionModel.find({}, projection);
    if (filter?.title) fictionQuery.where('title', new RegExp(filter.title, 'ig'));
    if (filter?.type) fictionQuery.where('type', filter.type);
    if (filter?.status) fictionQuery.where('status', filter.status);
    if (filter?.genre) fictionQuery.where('genres', filter.type);
    if (filter?.tag) fictionQuery.where('tags', filter.tag);
    if (filter?.author) fictionQuery.where('authors', filter.author);
    return fictionQuery;
  }

  async getFiction<T extends keyof Omit<Fiction, 'fid'>>(fid: ID, projection?: T[]): Promise<Pick<Fiction, 'fid' | T> | null>;
  async getFiction(fid: ID, projection?: Projection<Fiction>): Promise<Fiction | null>;
  async getFiction<T>(fid: ID, projection?: Projection<Fiction> | T[]): Promise<Fiction | null> {
    if (typeof fid === 'string') {
      const id = DBUtils.toObjectID(fid);
      if (!id) return null;
      fid = id;
    }
    const query = projection && !Array.isArray(projection) ? this.fictionModel.findOneAndUpdate({ fid }, { $inc: { views: 1 } }) : this.fictionModel.findOne({ fid });
    query.projection(projection);
    return await query.lean();
  }

  async getFictionList<T extends keyof Omit<Fiction, 'fid'>>(query: FictionQuery, projection?: T[]): Promise<Pick<Fiction, 'fid' | T>[]>;
  async getFictionList(query: FictionQuery, projection?: Projection<Fiction>): Promise<Fiction[]>;
  async getFictionList<T>(query: FictionQuery, projection?: Projection<Fiction> | T[]): Promise<Fiction[]> {
    return await this.getFictionsQuery(query.filter, projection)
      .sort({ [query.sort.field]: query.sort.order })
      .skip(query.page.offset)
      .limit(query.page.limit)
      .lean();
  }

  async getFictionCount(filter?: FictionFilter): Promise<number> {
    return await this.getFictionsQuery(filter).countDocuments();
  }

  async createFiction(input: FictionInput): Promise<Fiction> {
    return await this.fictionModel.create(input);
  }

  async updateFiction(fid: ID, update: Partial<FictionInput>): Promise<Fiction> {
    const fiction = await this.fictionModel.findOneAndUpdate({ fid }, { $set: update }).lean();
    if (!fiction) throw new AppError(ErrorCode.R001);
    return fiction;
  }

  async deleteFiction(fid: ID): Promise<Fiction> {
    const fiction = await this.fictionModel.findOneAndDelete({ fid }).lean();
    if (!fiction) throw new AppError(ErrorCode.R001);
    this.fictionChapterModel.deleteMany({ fid }).catch(err => this.logger.error(`Failed to delete all the chapters of novel '${fiction.name}' with ID '${fid}'`, err));
    return fiction;
  }
}
