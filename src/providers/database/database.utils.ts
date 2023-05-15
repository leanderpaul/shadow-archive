/**
 * Importing npm packages
 */
import { MongoServerError } from 'mongodb';
import { type Document, Query, type Schema, Types } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode, NeverError } from '@app/shared/errors';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

Query.prototype.unset = function (this: any, path) {
  path = Array.isArray(path) ? path : [path];
  this._update = this._update || {};
  this._update.$unset = this._update.$unset || {};
  for (const p of path) this._update.$unset[p] = '';
  return this;
};

function defaultLean(this: Query<unknown, unknown>) {
  if (this._mongooseOptions.lean === true) this.lean({ virtuals: true });
}

export function transformId(this: Document<unknown>) {
  if (!this._id) throw new NeverError('ObjectID is falsy');
  return this._id.toString();
}

export function handleDuplicateKeyError(throwError: AppError<any> | Record<string, AppError<any>>) {
  return function (error: Error, _result: unknown, next: (error?: Error) => void) {
    if (error instanceof MongoServerError && error.code === 11000) {
      if (throwError instanceof AppError) return next(throwError);
      for (const [key, value] of Object.entries(throwError)) {
        if (error.message.includes(key)) return next(value);
      }
    }
    return next(error);
  };
}

export function defaultOptionsPlugin(schema: Schema) {
  schema.plugin(mongooseLeanVirtuals);

  schema.pre('find', defaultLean);
  schema.pre('findOne', defaultLean);
  schema.pre('findOneAndUpdate', defaultLean);
  schema.pre('findOneAndDelete', defaultLean);
}

export class DBUtils {
  static toObjectID(id: string, throwError: true): Types.ObjectId;
  static toObjectID(id: string, throwError?: false): Types.ObjectId | null;
  static toObjectID(id: string, throwError?: boolean) {
    try {
      return new Types.ObjectId(id);
    } catch (err) {
      if (throwError) throw new AppError(ErrorCode.R001);
      return null;
    }
  }
}
