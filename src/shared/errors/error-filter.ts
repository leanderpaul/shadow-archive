/**
 * Importing npm packages
 */
import { ArgumentsHost, Catch, ExceptionFilter, ForbiddenException, NotFoundException } from '@nestjs/common';
import { type FastifyReply } from 'fastify';
import { GraphQLError } from 'graphql';
import { Error as MongooseError } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Logger } from '@app/providers/logger';
import { Context } from '@app/shared/services';

import { AppError } from './app.error';
import { ErrorCode } from './error-code.error';
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

/**
 * Declaring the constants
 */

@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = Logger.getLogger(ErrorFilter.name);

  private constructValidationMessage(errors: FieldError[]) {
    if (errors.length === 1) return `Validation failed for ${errors[0]?.field}`;
    const lastError = errors.pop();
    const fields = errors.map(error => error.field);
    return `Validation failed for ${fields.join(', ')} and ${lastError?.field}`;
  }

  private constructErrorPayload(error: Error): [number, FormattedError] {
    const rid = Context.getRID();

    if (error instanceof NotFoundException) error = new AppError(ErrorCode.R001);
    else if (error instanceof ForbiddenException) error = new AppError(ErrorCode.IAM004);

    if (error instanceof ValidationError || error instanceof MongooseError.ValidationError) {
      const fields = error instanceof ValidationError ? error.getErrors() : Object.values(error.errors).map(err => ({ field: err.path, msg: err.message }));
      const code = ErrorCode.R002.getCode();
      const type = ErrorCode.R002.getType();
      const message = this.constructValidationMessage([...fields]);
      const statusCode = ErrorCode.R002.getStatusCode();
      return [statusCode, { rid, code, message, type, fields }];
    }

    const appError = error instanceof AppError ? error : new AppError(ErrorCode.S001);
    const code = appError.getCode();
    const type = appError.getType();
    const message = appError.getMessage();
    const statusCode = appError.getStatusCode();
    return [statusCode, { rid, code, message, type }];
  }

  toGraphQLError(error: Error): GraphQLError {
    const { message, ...extensions } = this.constructErrorPayload(error)[1];
    return new GraphQLError(message, { extensions });
  }

  catch(error: Error, host: ArgumentsHost): GraphQLError | FastifyReply {
    this.logger.error(error);
    const [statusCode, payload] = this.constructErrorPayload(error);

    const isGraphQLRequest = !host.switchToHttp().getRequest();
    if (isGraphQLRequest) {
      const { message, ...extensions } = payload;
      return new GraphQLError(message, { extensions });
    }

    const res = Context.getCurrentResponse();
    return res.status(statusCode).send(payload);
  }
}
