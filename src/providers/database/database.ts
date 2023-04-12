/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { Logger } from '@app/providers';

/**
 * Importing and defining types
 */
import type { Connection } from 'mongoose';

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('database');
const debug = (colName: string, methodName: string, ...args: any[]) => logger.debug(`db.${colName}.${methodName}(${args.join(', ')})`);

export const DatabaseModule = MongooseModule.forRoot(Config.get('DB_URI'), {
  appName: Config.getAppName(),
  connectionFactory(connection: Connection) {
    /** Setting mongoose options */
    connection.set('id', false);
    connection.set('returnOriginal', false);
    connection.set('runValidators', true);
    connection.set('toObject', { virtuals: true });
    if (Config.get('LOG_LEVEL') === 'debug') connection.set('debug', debug);

    /** Handling mongoose connection errors */
    connection.on('error', (err: Error) => logger.error(err));

    return connection;
  },
});
