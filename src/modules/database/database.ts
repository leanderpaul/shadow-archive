/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose, { type Collection, type Connection, type Types } from 'mongoose';

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

export type ID = string | Types.ObjectId;

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('MongoDBModule');

function mongooseDebugLogger(this: Collection, collectionName: string, methodName: string, ...methodArgs: any[]) {
  const args: string[] = [];
  for (const value of methodArgs) args.push(this.$format(value));
  logger.debug(`db.${collectionName}.${methodName}(${args.join(', ')})`);
}

const MongoDBModule = MongooseModule.forRoot(Config.get('db.uri'), {
  appName: Config.get('app.name'),
  connectionFactory(connection: Connection) {
    /** Setting mongoose options */
    mongoose.set('id', false);
    mongoose.set('runValidators', true);
    mongoose.set('returnOriginal', false);
    mongoose.set('translateAliases', true);
    mongoose.set('toObject', { virtuals: true });
    if (Config.get('log.level') === 'debug') mongoose.set('debug', mongooseDebugLogger);

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
