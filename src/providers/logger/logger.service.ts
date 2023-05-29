/**
 * Importing npm packages
 */
import fs from 'fs';

import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import { type LoggerService, type OnApplicationShutdown } from '@nestjs/common';
import { type FastifyReply, type FastifyRequest } from 'fastify';
import { type Logger as WinstonLogger, createLogger as createWinstonLogger, format, transports } from 'winston';

/**
 * Importing user defined packages
 */
import { Config, Context } from '@app/shared/services';

import { consoleFormat, contextFormat } from './formats.logger';

/**
 * Defining types
 */

export interface RequestMetadata {
  rid?: string;
  service?: string;
  method?: string;
  url?: string;
  status?: number;
  reqLen?: string;
  reqIp?: string;
  resLen?: string;
  timeTaken?: string;
  body?: any;
  query?: object;
  [key: string]: any;
}

type Middleware = (req: FastifyRequest, _res: FastifyReply, next: () => void) => void;

declare module 'fastify' {
  interface FastifyRequest {
    startTime: [number, number];
  }
}

/**
 * Declaring the constants
 */
const logColorFormat = { info: 'green', error: 'bold red', warn: 'yellow', debug: 'magenta', http: 'cyan' };
const sensitiveFields = ['password'];

/**
 * Gets the index or number of the log file
 * @param filename
 * @returns
 */
function getFileIndex(filename: string): number {
  const filenameArr = filename.split(/[-.]/);
  const num = filenameArr[filenameArr.length - 2] || '0';
  return parseInt(num);
}

export class Logger implements LoggerService, OnApplicationShutdown {
  private static instance: WinstonLogger;
  private static logtail: Logtail;

  private readonly instance;

  private constructor(label: string) {
    this.instance = Logger.getLogger(label);
  }

  /** Mutates the input object to remove the sensitive fields that are present in it */
  private static removeSensitiveFields(data: Record<string, any>): Record<string, any> {
    for (const key in data) {
      const value = data[key];
      if (sensitiveFields.includes(key)) data[key] = 'xxxx';
      else if (typeof value === 'object' && !Array.isArray(value)) this.removeSensitiveFields(value);
    }
    return data;
  }

  /** Creates the winston logger object */
  private static initLogger(): WinstonLogger {
    const nodeEnv = Config.get('app.env');
    const logFormat = format.combine(contextFormat(), format.errors({ stack: true }), format.json({}));
    const logger = createWinstonLogger({ level: Config.get('log.level') });

    /** Logger setup for development mode */
    if (nodeEnv === 'development') {
      const consoleColor = format.colorize({ level: true, colors: logColorFormat, message: true });
      const uppercaseLevel = format(info => ({ ...info, level: info.level.toUpperCase() }));
      const consoleLogFormat = format.combine(format.errors({ stack: true }), uppercaseLevel(), consoleColor, consoleFormat);
      logger.add(new transports.Console({ format: consoleLogFormat }));
    }

    const logtailApikey = Config.get('log.logtail.apikey');
    if (nodeEnv === 'production' && logtailApikey) {
      this.logtail = new Logtail(logtailApikey);
      logger.add(new LogtailTransport(this.logtail, { format: logFormat }));
    } else {
      const logDir = Config.get('log.dir');
      try {
        fs.accessSync(logDir);
      } catch (err) {
        fs.mkdirSync(logDir);
      }

      /** Changing the name of the old files so that the file '<app-name>-0.log' always contains the latest logs */
      const appName = Config.get('app.name');
      const logFiles = fs.readdirSync(logDir);
      const regex = new RegExp(`^(${appName}-)[0-9]+(.log)$`);
      const appLogFiles = logFiles.filter(filename => regex.test(filename));
      const sortedFilenames = appLogFiles.sort((a, b) => getFileIndex(b) - getFileIndex(a));
      for (const filename of sortedFilenames) {
        const num = getFileIndex(filename);
        fs.renameSync(`${logDir}/${filename}`, `${logDir}/${appName}-${num + 1}.log`);
      }

      logger.add(new transports.File({ format: logFormat, filename: `${logDir}/${appName}-0.log` }));
    }

    return logger;
  }

  static getLogger(input: string): WinstonLogger {
    if (!this.instance) this.instance = this.initLogger();
    return this.instance.child({ label: input });
  }

  static getNestLogger(input: string): Logger {
    return new Logger(input);
  }

  static getRequestStartHandler(): Middleware {
    return (req, _res, next) => {
      req.startTime = process.hrtime();
      return next();
    };
  }

  static getRequestEndHandler(): Middleware {
    return (req, res, next) => {
      const isLoggingDisabled = Context.get<boolean>('DISABLE_REQUEST_LOGGING') ?? false;
      if (isLoggingDisabled) return next();

      const metadata: RequestMetadata = {};
      metadata.rid = Context.getRID();
      metadata.url = req.url;
      metadata.method = req.method;
      metadata.status = res.statusCode;
      metadata.service = req.headers['x-shadow-service'] as string;
      metadata.reqLen = req.headers['content-length'];
      metadata.reqIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      metadata.resLen = res.getHeader('content-length') as string;
      const resTime = process.hrtime(req.startTime);
      metadata.timeTaken = (resTime[0] * 1e3 + resTime[1] * 1e-6).toFixed(3); // Converting time to milliseconds
      if (req.query) metadata.query = req.query;
      if (req.body) metadata.body = this.removeSensitiveFields({ ...req.body });
      this.instance.http('http', metadata);
      return next();
    };
  }

  static close(): void {
    this.logtail?.flush();
    this.instance.close();
  }

  onApplicationShutdown(): void {
    this.log(`Application shutting down`);
    return Logger.close();
  }

  log(message: string, label?: string): void {
    this.instance.info(message, { label });
  }

  error(message: string, trace?: string, label?: string): void {
    this.instance.error(trace || message, { trace, label, msg: message });
  }

  warn(message: string, label?: string): void {
    this.instance.warn(message, { label });
  }

  debug(message: string, label?: string): void {
    this.instance.debug(message, { label });
  }

  verbose(message: string, label?: string): void {
    this.instance.verbose(message, { label });
  }
}
