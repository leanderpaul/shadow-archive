/**
 * Importing npm packages
 */
import { ValidationError } from 'class-validator';
import { Error as MongooseError } from 'mongoose';

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */

export type TAppErrorCodes = 'CLIENT_ERROR' | 'HTTP_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'SERVER_ERROR';

export interface FieldError {
  field: string;
  msg: string;
}

export interface FormattedAppError {
  code: string;
  msg: string;
  fields?: FieldError[];
}

/**
 * Declaring the constants
 */

export class AppError<T> extends Error {
  protected cause: T[] = [];
  protected code: TAppErrorCodes;

  constructor(code: TAppErrorCodes, msg: string, cause?: T | T[]) {
    super(msg);
    this.code = code;
    if (cause) this.cause = Array.isArray(cause) ? cause : [cause];
  }

  private static constructValidationMessage(errors: FieldError[]) {
    const fields = errors.map(e => e.field);
    return fields.length === 1
      ? `Validation failed for ${fields[0]}`
      : `Validation failed for ${fields.join(', ').replace(fields[fields.length - 1]!, `and ${fields[fields.length - 1]}`)}`;
  }

  static formatError(error: unknown, throwUnexpectedError?: boolean): FormattedAppError {
    const fields: FieldError[] = [];
    if (error instanceof ValidationError) fields.push(AppError.handleClassValidationError(error));
    else if (error instanceof MongooseError) fields.push(...AppError.handleMongooseError(error));

    if (throwUnexpectedError && fields.length === 0) throw new AppError('SERVER_ERROR', 'Unexpected Server Error');

    return fields.length > 0
      ? { code: 'VALIDATION_ERROR', msg: AppError.constructValidationMessage(fields), fields }
      : { code: 'UNEXPECTED_SERVER_ERROR', msg: 'Unexpected Server Error' };
  }

  static NotFound() {
    return new AppError('NOT_FOUND', 'Resource not found');
  }

  private static handleClassValidationError(error: ValidationError) {
    const constructorName = error.target?.constructor.name;
    const field = constructorName ? `${constructorName}.${error.property}` : error.property;
    const msg = error.constraints ? Object.values(error.constraints).join(', ') : 'Invalid value';
    return { field, msg } as FieldError;
  }

  private static handleMongooseError(error: MongooseError) {
    const fields: FieldError[] = [];
    if (error instanceof MongooseError.ValidationError) {
      for (const err of Object.values(error.errors)) {
        fields.push({ field: err.path, msg: err.message });
      }
    }
    return fields;
  }

  getFormattedError(): FormattedAppError {
    const error: FormattedAppError = { code: this.code, msg: this.message };

    if (this.cause.length > 0) {
      error.fields = [];
      for (const cause of this.cause) {
        if (cause instanceof ValidationError) {
          const FieldError = AppError.handleClassValidationError(cause);
          error.fields.push(FieldError);
        } else if (cause instanceof MongooseError) {
          const fieldErrors = AppError.handleMongooseError(cause);
          error.fields.push(...fieldErrors);
        }
      }
    }

    return error;
  }

  getCause() {
    return this.cause;
  }

  getCode() {
    return this.code;
  }
}
