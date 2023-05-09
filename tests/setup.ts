/**
 * Importing npm packages
 */
import mongoose from 'mongoose';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

process.env.DB_URI = process.env.DB_URI || 'mongodb://localhost/shadow-test';

module.exports = async function () {
  /** Deleting old test data */
  await mongoose.connect(process.env.DB_URI!);
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
};

export {};
