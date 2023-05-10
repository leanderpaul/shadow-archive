/**
 * Importing npm packages
 */
import { ArgumentsHost, Catch, ExceptionFilter, ForbiddenException, NotFoundException } from '@nestjs/common';
import { type FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */
import { AppError } from './app.error';
import { ErrorCode, ErrorType } from './error-code.error';
import { ErrorUtils } from './util.error';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    /** GraphQL exceptions will be handled by graphql module */
    const isGraphQLRequest = !host.switchToHttp().getRequest();
    if (isGraphQLRequest) return error;

    /** Converting the errors into AppError */
    if (error instanceof NotFoundException) error = new AppError(ErrorCode.R001);
    else if (error instanceof ForbiddenException) error = new AppError(ErrorCode.IAM004);

    /** Generating the response payload and status code */
    const payload = ErrorUtils.formatError(error);
    const statusCode = error instanceof AppError ? error.getStatusCode() : payload.type === ErrorType.VALIDATION_ERROR ? 400 : 500;

    const response = host.switchToHttp().getResponse<FastifyReply>();
    return response.status(statusCode).send(payload);
  }
}
