/**
 * Importing npm packages
 */
import { Types } from 'mongoose';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors/internal';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export class ParserService {
  toObjectID(id: string, throwError: true): Types.ObjectId;
  toObjectID(id: string, throwError?: false): Types.ObjectId | null;
  toObjectID(id: string, throwError?: boolean): Types.ObjectId | null {
    try {
      return new Types.ObjectId(id);
    } catch (err) {
      if (throwError) throw new AppError(ErrorCode.R001);
      return null;
    }
  }
}

const globalRef = global as any;
export const Parser: ParserService = globalRef.ParserService || (globalRef.ParserService = new ParserService());
