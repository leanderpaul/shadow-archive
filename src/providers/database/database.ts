/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { Logger } from '@app/providers/logger';

import { DatabaseService } from './database.service';
import { ExpenseMongooseModule, MemoirMongooseModule, UserMongooseModule } from './schemas';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('database');
const debug = (colName: string, methodName: string, ...args: any[]) => logger.debug(`db.${colName}.${methodName}(${args.map(obj => JSON.stringify(obj)).join(', ')})`);

/** Setting mongoose options */
mongoose.set('id', false);
mongoose.set('runValidators', true);
mongoose.set('returnOriginal', false);
mongoose.set('toObject', { virtuals: true });
mongoose.set('debug', Config.get('LOG_LEVEL') === 'debug' ? debug : false);

const MongoDBModule = MongooseModule.forRoot(Config.get('DB_URI'), {
  appName: Config.getAppName(),
  connectionFactory(connection: Connection) {
    /** Handling mongoose connection errors */
    connection.on('error', (err: Error) => logger.error(err));
    connection.on('close', () => logger.debug(`mongodb connection closed`));

    return connection;
  },
});

@Module({
  imports: [MongoDBModule, UserMongooseModule, ExpenseMongooseModule, MemoirMongooseModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
