/**
 * Importing npm packages
 */
import { Injectable, LoggerService, OnApplicationShutdown, Optional } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { Logger } from './logger.util';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Injectable()
export class NestLogger implements LoggerService, OnApplicationShutdown {
  private static readonly logger = Logger.getLogger('nest');

  constructor(@Optional() protected context?: string) {}

  onApplicationShutdown() {
    this.log(`Application shutting down`);
    return Logger.close();
  }

  public log(message: any, context?: string): any {
    const label = context || this.context;
    if ('object' === typeof message) {
      const { message: msg, ...meta } = message;
      return NestLogger.logger.info(msg, { label, value: message, ...meta });
    }
    return NestLogger.logger.info(message, { context });
  }

  public error(message: any, trace?: string, context?: string): any {
    /**
     * This is to prevent nestjs from printing the error messages from the graphql module since it is already handled by
     * the apollo graphql format error function.
     */
    if (trace && trace.includes('/src/graphql/')) return;

    const label = context || this.context;
    if (message instanceof Error) {
      const { message: msg, name, stack, ...meta } = message;
      return NestLogger.logger.error(msg, { context, stack: [trace || stack], value: message, errName: name, ...meta });
    }
    if (typeof message === 'object') {
      const { message: msg, ...meta } = message;
      return NestLogger.logger.error(msg, { label, stack: [trace || message.stack], value: message, ...meta });
    }
    return NestLogger.logger.error(message, { context, stack: [trace] });
  }

  public warn(message: any, context?: string): any {
    const label = context || this.context;
    if ('object' === typeof message) {
      const { message: msg, ...meta } = message;
      return NestLogger.logger.warn(msg, { label, value: message, ...meta });
    }
    return NestLogger.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    const label = context || this.context;
    if ('object' === typeof message) {
      const { message: msg, ...meta } = message;
      return NestLogger.logger.debug(msg, { label, value: message, ...meta });
    }
    return NestLogger.logger.debug(message, { context });
  }

  public verbose?(message: any, context?: string): any {
    const label = context || this.context;
    if ('object' === typeof message) {
      const { message: msg, ...meta } = message;
      return NestLogger.logger.verbose(msg, { label, value: message, ...meta });
    }
    return NestLogger.logger.verbose(message, { context });
  }
}
