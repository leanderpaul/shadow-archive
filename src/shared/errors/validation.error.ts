/**
 * Importing npm packages
 */
import { Error as MongooseError } from 'mongoose';

/**
 * Importing user defined packages
 */
import { ErrorCode } from './error-code.error';
import { FormattedError } from './util.error';

/**
 * Defining types
 */

export interface FieldError {
  field: string;
  msg: string;
}

/**
 * Declaring the constants
 */

export class ValidationError extends Error {
  private errors: FieldError[] = [];

  constructor();
  constructor(field: string, message: string);
  constructor(field?: string, message?: string) {
    super(ErrorCode.R002.getMessage());
    this.name = 'ValidationError';
    if (field && message) this.addFieldError(field, message);
  }

  private static getMessage(errors: FieldError[]) {
    const fields = errors.map(e => e.field);
    return fields.length === 1
      ? `Validation failed for ${fields[0]}`
      : `Validation failed for ${fields.join(', ').replace(fields[fields.length - 1]!, `and ${fields[fields.length - 1]}`)}`;
  }

  static formatMongooseValidationError(error: MongooseError.ValidationError): FormattedError {
    const fields: FieldError[] = Object.values(error.errors).map(err => ({ field: err.path, msg: err.message }));
    const message = ValidationError.getMessage(fields);
    return { ...ErrorCode.R002.getFormattedError(), message, fields };
  }

  addFieldError(field: string, msg: string) {
    this.errors.push({ field, msg });
    return this;
  }

  getErrors() {
    return this.errors;
  }

  getErrorCount() {
    return this.errors.length;
  }

  getFormattedError(): FormattedError {
    const message = ValidationError.getMessage(this.getErrors());
    return { ...ErrorCode.R002.getFormattedError(), message, fields: this.getErrors() };
  }
}
