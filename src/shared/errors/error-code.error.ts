/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */
import { Context } from '@app/providers/context';

import { type FormattedError } from './util.error';

/**
 * Defining types
 */

export enum ErrorType {
  CLIENT_ERROR = 'CLIENT_ERROR',
  HTTP_ERROR = 'HTTP_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CUSTOM_ERROR = 'CUSTOM_ERROR',
}

/**
 * Declaring the constants
 */

export class ErrorCode {
  private constructor(private readonly code: string, private readonly type: ErrorType, private readonly msg: string) {}

  getCode() {
    return this.code;
  }

  getType() {
    return this.type;
  }

  getMessage() {
    return this.msg;
  }

  getFormattedError(): FormattedError {
    return { rid: Context.getRID(), code: this.getCode(), type: this.getType(), message: this.getMessage() };
  }

  /*!
   * List of all IAM related errors
   */

  /** user account does not exist */
  static readonly IAM001 = new ErrorCode('IAM001', ErrorType.NOT_FOUND, 'user account does not exist');
  /** user not authenticated */
  static readonly IAM002 = new ErrorCode('IAM002', ErrorType.UNAUTHORIZED, 'user not authenticated');
  /** user not verified */
  static readonly IAM003 = new ErrorCode('IAM003', ErrorType.UNAUTHORIZED, 'user not verified');
  /** user not authorized to access this resource */
  static readonly IAM004 = new ErrorCode('IAM004', ErrorType.UNAUTHORIZED, 'user not authorized to access this resource');
  /** CSRF Token invalid */
  static readonly IAM005 = new ErrorCode('IAM005', ErrorType.UNAUTHORIZED, 'CSRF Token invalid');
  /** User email address or password is incorrect */
  static readonly IAM006 = new ErrorCode('IAM006', ErrorType.CLIENT_ERROR, 'User email address or password is incorrect');
  /** only native user's can change the password */
  static readonly IAM007 = new ErrorCode('IAM007', ErrorType.CLIENT_ERROR, "only native user's can change the password");
  /** Incorrect password */
  static readonly IAM008 = new ErrorCode('IAM008', ErrorType.CLIENT_ERROR, 'Incorrect password');
  /** You are not authorized to access this resource */
  static readonly IAM009 = new ErrorCode('IAM009', ErrorType.UNAUTHORIZED, 'You are not authorized to access this resource');
  /** Invalid or expired password reset code */
  static readonly IAM010 = new ErrorCode('IAM010', ErrorType.CLIENT_ERROR, 'Invalid or expired password reset code');
  /** Invalid email verification code */
  static readonly IAM011 = new ErrorCode('IAM011', ErrorType.CLIENT_ERROR, 'Invalid email verification code');
  /** Email address already verified */
  static readonly IAM012 = new ErrorCode('IAM012', ErrorType.CLIENT_ERROR, 'Email address already verified');
  /** User session expired */
  static readonly IAM013 = new ErrorCode('IAM013', ErrorType.UNAUTHORIZED, 'User session expired');

  /**
   * List of resource related errors
   */

  /** Resource not found */
  static readonly R001 = new ErrorCode('R001', ErrorType.NOT_FOUND, 'Resource not found');
  /** Resource input validation failed */
  static readonly R002 = new ErrorCode('R002', ErrorType.CLIENT_ERROR, 'Resource input validation failed');
  /** Email address is already taken */
  static readonly R003 = new ErrorCode('R003', ErrorType.HTTP_ERROR, 'Email address is already taken');

  /*!
   * List of all server related errrors
   */

  /** Unexpected server error */
  static readonly S001 = new ErrorCode('S001', ErrorType.SERVER_ERROR, 'Unexpected server error');
  /** only to be used when setting custom error type and message in `AppError` */
  static readonly S002 = new ErrorCode('S002', ErrorType.CUSTOM_ERROR, 'Custom error');
  /** Introspection queries are not allowed */
  static readonly S003 = new ErrorCode('S003', ErrorType.UNAUTHORIZED, 'Introspection queries are not allowed');
}
