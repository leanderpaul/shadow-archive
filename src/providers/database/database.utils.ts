/**
 * Importing npm packages
 */
import { Types, Query } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';

/**
 * Importing user defined packages
 */
import { AppError } from '@app/shared/errors';

/**
 * Importing and defining types
 */
import type { Document, Schema } from 'mongoose';

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
  return this._id!.toString();
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
      if (throwError) throw AppError.NotFound();
      return null;
    }
  }
}
