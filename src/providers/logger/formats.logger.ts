/**
 * Importing npm packages
 */
import { cyan, gray, yellow } from '@colors/colors/safe';
import { LEVEL } from 'triple-beam';
import { format } from 'winston';

/**
 * Importing user defined packages
 */
import { Context, Storage } from '@app/shared/services';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

let timestamp: number;

/** Formats and print the logs to the console */
export const consoleFormat = format.printf(info => {
  const level = info[LEVEL];
  const prevTime = timestamp;
  timestamp = Date.now();
  const timeTaken = prevTime ? gray(` +${timestamp - prevTime}ms`) : '';
  const stack = info.stack ? '\n' + (Array.isArray(info.stack) ? info.stack.join('\n') : info.stack) : '';
  const isGraphQL = info.method === 'POST' && Storage.get<string[]>('graphql', []).includes(info.url.substring(9));

  if (level != 'http') return `${(info.level + '  ').substring(0, 15)} ${yellow(`[${info.label || '-'}]`)} ${info.message} ${timeTaken} ${stack}`;
  if (!isGraphQL) return cyan(`HTTP  [REST] ${info.method} ${info.url} - ${info.timeTaken}ms`);

  /** Parsing GraphQL Request */
  const body = info.body || {};
  const query = body.query as string;
  const op = query.trim().startsWith('query') ? 'Query' : 'Mutation';
  let opName = body.operationName;
  if (!opName) {
    const queryArr = query.substring(0, query.indexOf('{')).trim().split(' ');
    opName = queryArr.find(w => w && !/(query|mutation)/.test(w.toLowerCase()));
  }
  return cyan(`HTTP  [GraphQL] ${op} ${opName} - ${info.timeTaken}ms`);
});

/** Appends the time and the request ID to the log metadata */
export const contextFormat = format(info => {
  const rid = Context.getOptional('RID');
  if (rid) info.rid = rid;
  info.dt = new Date();
  return info;
});
