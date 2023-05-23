/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose, { type Connection } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Logger } from '@app/providers/logger';
import { Config } from '@app/shared/services';

import { DatabaseService } from './database.service';
import { ExpenseMongooseModule, MemoirMongooseModule, UserMongooseModule } from './schemas';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('MongooseModule');

const MongoDBModule = MongooseModule.forRoot(Config.get('db.uri'), {
  appName: Config.get('app.name'),
  connectionFactory(connection: Connection) {
    /** Setting mongoose options */
    mongoose.set('id', false);
    mongoose.set('runValidators', true);
    mongoose.set('returnOriginal', false);
    mongoose.set('toObject', { virtuals: true });
    mongoose.set('debug', Config.get('log.level') === 'debug');

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
