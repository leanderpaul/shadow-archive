/**
 * Importing npm packages.
 */
import fs from 'fs';

import { cyan, gray, yellow } from '@colors/colors/safe';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import { type FastifyReply, type FastifyRequest } from 'fastify';
import { LEVEL } from 'triple-beam';
import { type Logform, type Logger as WinstonLogger, createLogger as createWinstonLogger, format, transports } from 'winston';

/**
 * Importing user defined packages.
 */
import { Config } from '@app/config';
import { Context } from '@app/providers/context';

/**
 * Defining types
 */

export interface LogMetadata {
  service?: string;
  filename?: string;
  [key: string]: any;
}

export interface RequestMetadata {
  rid?: string;
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

declare module 'fastify' {
  interface FastifyRequest {
    startTime: [number, number];
  }
}

/**
 * Declaring the constants.
 */
const logColorFormat = { info: 'green', error: 'bold red', warn: 'yellow', debug: 'magenta', http: 'cyan' };
const sensitiveFields = ['password'];

let logger: WinstonLogger;
let logtail: Logtail;
let timestamp: number;

/**
 * Appends the time and the request ID to the log metadata
 * @param info
 * @returns
 */
function appendLogMetadata(info: Logform.TransformableInfo) {
  const rid = Context.getRID();
  if (rid) info.rid = rid;
  info.dt = new Date();
  return info;
}

/**
 * Formats and print the logs to the console
 * @param info
 * @returns
 */
function printConsoleMessage(info: Logform.TransformableInfo) {
  const level = info[LEVEL];
  const prevTime = timestamp;
  timestamp = Date.now();
  const timeTaken = prevTime ? gray(` +${timestamp - prevTime}ms`) : '';
  const stack = info.stack ? '\n' + (Array.isArray(info.stack) ? info.stack.join('\n') : info.stack) : '';

  if (level != 'http') return `${info.level} ${yellow(`[${info.label || '-'}]`)} ${info.message} ${timeTaken} ${stack}`;
  if (info.url != '/graphql' || info.method != 'POST') return cyan(`HTTP [REST] ${info.method} ${info.url} - ${info.timeTaken}ms`);

  /** Parsing GraphQL Request */
  const body = info.body || {};
  const query = body.query as string;
  const op = query.trim().startsWith('query') ? 'Query' : 'Mutation';
  let opName = body.operationName;
  if (!opName) {
    const queryArr = query.substring(0, query.indexOf('{')).trim().split(' ');
    opName = queryArr.find(w => w && !/(query|mutation)/.test(w.toLowerCase()));
  }
  return cyan(`HTTP [GraphQL] ${op} ${opName} - ${info.timeTaken}ms`);
}

/**
 * Mutates the input object to remove the sensitive fields that are present in it
 * @param data
 * @returns
 */
function removeSensitiveFields(data: Record<string, any>) {
  for (const key in data) {
    const value = data[key];
    if (sensitiveFields.includes(key)) data[key] = 'xxxx';
    else if (typeof value === 'object' && !Array.isArray(value)) removeSensitiveFields(value);
  }
  return data;
}

/**
 * Gets the index or number of the log file
 * @param filename
 * @returns
 */
function getFileIndex(filename: string) {
  const filenameArr = filename.split(/[-.]/);
  return parseInt(filenameArr[filenameArr.length - 2]!);
}

/**
 * Creates the winston logger object
 * @returns
 */
function createLogger() {
  /** Creating the logger object */
  const contextFormat = format(appendLogMetadata);
  const logFormat = format.combine(contextFormat(), format.errors({ stack: true }), format.json({}));
  const logger = createWinstonLogger({ level: Config.getLog('LEVEL') });

  /** Logger setup for development mode */
  if (Config.getNodeEnv() === 'development') {
    const consoleFormat = format.printf(printConsoleMessage);
    const consoleColor = format.colorize({ level: true, colors: logColorFormat, message: true });
    const uppercaseLevel = format(info => ({ ...info, level: info.level.toUpperCase() }));
    const consoleLogFormat = format.combine(format.errors({ stack: true }), uppercaseLevel(), consoleColor, consoleFormat);
    logger.add(new transports.Console({ format: consoleLogFormat }));
  }

  if (Config.getNodeEnv() === 'production') {
    logtail = new Logtail(Config.get('LOGTAIL_SOURCE_TOKEN')!);
    logger.add(new LogtailTransport(logtail, { format: logFormat }));
  } else {
    /** Creating the log directory if it does not exist */
    const logDir = Config.getLog('DIR');
    const appName = Config.getAppName();
    try {
      fs.accessSync(logDir);
    } catch (err) {
      fs.mkdirSync(logDir);
    }

    /** Changing the name of the old files so that the file '<app-name>-0.log' always contains the latest logs */
    const logFiles = fs.readdirSync(logDir);
    const regex = new RegExp(`^(${appName}-)[0-9]+(.log)$`);
    const appLogFiles = logFiles.filter(filename => regex.test(filename));
    const sortedFilenames = appLogFiles.sort((a, b) => getFileIndex(b) - getFileIndex(a));
    for (let index = 0; index < sortedFilenames.length; index++) {
      const filename = sortedFilenames[index]!;
      const num = getFileIndex(filename);
      fs.renameSync(`${logDir}/${filename}`, `${logDir}/${appName}-${num + 1}.log`);
    }

    logger.add(new transports.File({ format: logFormat, filename: `${Config.getLog('DIR')}/${Config.getAppName()}-0.log` }));
  }

  return logger;
}

/**
 * Object contains methods that handle Logging
 */
export const Logger = {
  /**
   * Provides a logger instance
   * @param input
   * @returns
   */
  getLogger(input: string | LogMetadata) {
    if (!logger) logger = createLogger();
    return typeof input === 'string' ? logger.child({ label: input }) : logger.child({ ...input });
  },

  /**
   * Sets the request start time in request object
   */
  getRequestStartHandler() {
    return (req: FastifyRequest, _res: FastifyReply, next: () => void) => {
      req.startTime = process.hrtime();
      return next();
    };
  },

  /**
   * Logs the request data and time taken to complete the request
   */
  getRequestEndHandler() {
    return (req: FastifyRequest, res: FastifyReply, next: () => void) => {
      const isLoggingDisabled = Context.get<boolean>('DISABLE_REQUEST_LOGGING') ?? false;
      if (isLoggingDisabled && Config.getNodeEnv() === 'production') return next();

      const metadata: RequestMetadata = {};
      metadata.rid = Context.getRID();
      metadata.url = req.url;
      metadata.method = req.method;
      metadata.status = res.statusCode;
      metadata.reqLen = req.headers['content-length'];
      metadata.reqIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      metadata.resLen = res.getHeader('content-length') as string;
      const resTime = process.hrtime(req.startTime);
      metadata.timeTaken = (resTime[0] * 1e3 + resTime[1] * 1e-6).toFixed(3); // Converting time to milliseconds
      if (req.query) metadata.query = req.query;
      if (req.body) metadata.body = removeSensitiveFields({ ...req.body });
      logger.http('http', metadata);
      return next();
    };
  },

  /**
   * Closes the log stream
   */
  close() {
    logtail?.flush();
    logger.close();
  },
};
