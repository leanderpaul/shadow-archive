/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { Logger } from '@app/providers/logger';

import { DatabaseService } from './database.service';
import { UserMongooseModule, ExpenseMongooseModule, MetadataMongooseModule, MemoirMongooseModule } from './schemas';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('database');
const debug = (colName: string, methodName: string, ...args: any[]) => logger.debug(`db.${colName}.${methodName}(${args.map(obj => JSON.stringify(obj)).join(', ')})`);

const MongoDBModule = MongooseModule.forRoot(Config.get('DB_URI'), {
  appName: Config.getAppName(),
  connectionFactory(connection: Connection) {
    /** Setting mongoose options */
    connection.set('id', false);
    connection.set('returnOriginal', false);
    connection.set('toObject', { virtuals: true });
    if (Config.get('LOG_LEVEL') === 'debug') connection.set('debug', debug);

    /** Handling mongoose connection errors */
    connection.on('error', (err: Error) => logger.error(err));
    connection.on('close', () => logger.debug(`mongodb connection closed`));

    return connection;
  },
});

@Module({
  imports: [MongoDBModule, UserMongooseModule, ExpenseMongooseModule, MetadataMongooseModule, MemoirMongooseModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
