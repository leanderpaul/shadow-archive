/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */
import { Context } from '@app/providers/context';

import { ErrorType, ErrorCode } from './error-code.error';
import { FormattedError } from './util.error';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export class AppError<T> extends Error {
  private code: string;
  private type: ErrorType;
  private details: T;

  static throw(code: ErrorCode) {
    throw new AppError(code);
  }

  constructor(code: ErrorCode, details?: T);
  constructor(type: ErrorType, msg: string, details?: T);
  constructor(codeOrType: ErrorCode | ErrorType, msgOrDetails?: T | string, details?: T) {
    super();

    if (codeOrType instanceof ErrorCode) {
      this.type = codeOrType.getType();
      this.code = codeOrType.getCode();
      this.message = codeOrType.getMessage();
      if (msgOrDetails) this.details = msgOrDetails as T;
      return;
    }

    this.type = codeOrType;
    this.code = ErrorCode.S002.getCode();
    this.message = msgOrDetails as string;
    if (details) this.details = details;
  }

  getType() {
    return this.type;
  }

  getCode() {
    return this.code;
  }

  getMessage() {
    return this.message;
  }

  getFormattedError(): FormattedError {
    return { rid: Context.getRID(), code: this.getCode(), type: this.getType(), message: this.getMessage() };
  }
}
