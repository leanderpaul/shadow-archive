/**
 * Importing npm packages
 */
import { ArgumentsHost, NotFoundException, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */
import { ErrorCode } from '@app/shared/errors/error-code.error';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Catch(NotFoundException)
export class NotFoundFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    return response.status(exception.getStatus()).send(ErrorCode.R001.getFormattedError());
  }
}
