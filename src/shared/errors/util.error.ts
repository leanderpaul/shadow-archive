/**
 * Importing npm packages
 */
import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import { Error as MongooseError } from 'mongoose';
import { type Logger } from 'winston';

/**
 * Importing user defined packages
 */
import { AppError } from './app.error';
import { ErrorCode, ErrorType } from './error-code.error';
import { type FieldError, ValidationError } from './validation.error';

/**
 * Defining types
 */

export interface FormattedError {
  rid: string;
  code: string;
  type: string;
  message: string;
  fields?: FieldError[];
}

export interface GraphQLFormattedErrorExtensions extends FormattedError {
  rid: string;
}

/**
 * Declaring the constants
 */

export class ErrorUtils {
  /** Formatting the GraphQL Errors */
  static formatGraphQLError(formattedError: GraphQLFormattedError, error: unknown, logger: Logger) {
    if (error instanceof GraphQLError) error = error.originalError;
    if (formattedError.extensions?.code) delete formattedError.extensions.code;
    const { message, ...extensions } = ErrorUtils.formatError(error);
    const obj = { ...formattedError, message, extensions: { ...extensions, ...formattedError.extensions } };

    if (extensions.code === ErrorType.SERVER_ERROR) logger.error(error);
    else logger.warn(error);

    return obj;
  }

  static formatMongooseError(error: MongooseError): FormattedError {
    if (error instanceof MongooseError.ValidationError) return ValidationError.formatMongooseValidationError(error);
    return ErrorCode.S001.getFormattedError();
  }

  static formatError(error: unknown, throwUnexpectedError = false) {
    let formattedError = ErrorCode.S001.getFormattedError();
    if (error instanceof AppError || error instanceof ValidationError) formattedError = error.getFormattedError();
    else if (error instanceof MongooseError) formattedError = this.formatMongooseError(error);
    if (throwUnexpectedError && formattedError.code === ErrorType.SERVER_ERROR) throw new AppError(ErrorCode.S001, error);
    return formattedError;
  }
}
