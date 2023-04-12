/**
 * Importing npm packages
 */
import mongoose from 'mongoose';

/**
 * Importing user defined packages
 */
import { sampleUsers } from './testdata';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */
process.env.DB_URI = 'mongodb://localhost/shadow-testing';

module.exports = async function () {
  /** Deleting old test data */
  await mongoose.connect(process.env.DB_URI!);
  await mongoose.connection.db.dropDatabase();

  await mongoose.connection.db.collection('users').insertMany(Object.values(sampleUsers));

  await mongoose.connection.close();
};

export {};
