/**
 * Importing npm packages
 */
import { ArgumentsHost, NotFoundException, Catch } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { Context } from '@app/providers';

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
    const data = { rid: Context.getRID(), code: 'NOT_FOUND', message: 'Resource not found' };
    return response.status(exception.getStatus()).send(data);
  }
}
