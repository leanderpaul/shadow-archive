/**
 * Importing npm packages
 */
import { ArgumentsHost, NotFoundException, Catch } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { Context } from '@app/providers';
import { ErrorCode } from '@app/shared/errors/error-code.error';

/**
 * Importing and defining types
 */

import type { ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

/**
 * Declaring the constants
 */

@Catch(NotFoundException)
export class NotFoundFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const data = { rid: Context.getRID(), ...ErrorCode.R001.getFormattedError() };
    return response.status(exception.getStatus()).send(data);
  }
}
