/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */
import { Context } from '@app/providers/context';

import { ErrorCode, ErrorType } from './error-code.error';
import { FormattedError } from './util.error';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.CLIENT_ERROR]: 400,
  [ErrorType.CUSTOM_ERROR]: 500,
  [ErrorType.HTTP_ERROR]: 400,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.SERVER_ERROR]: 500,
  [ErrorType.UNAUTHORIZED]: 403,
  [ErrorType.VALIDATION_ERROR]: 400,
};

export class AppError<T> extends Error {
  private statusCode = 500;
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
      this.statusCode = codeOrType.getType() === ErrorType.UNAUTHORIZED ? (!Context.getCurrentUser() ? 401 : 403) : ERROR_STATUS_CODES[this.getType()];
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

  getDetails() {
    return this.details;
  }

  getFormattedError(): FormattedError {
    return { rid: Context.getRID(), code: this.getCode(), type: this.getType(), message: this.getMessage() };
  }

  getStatusCode() {
    return this.statusCode;
  }

  setStatusCode(statusCode: number) {
    this.statusCode = statusCode;
    return this;
  }
}
