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

const uri = process.env.DB_URI ?? 'mongodb://localhost/shadow-test-database';
process.env.DB_URI = uri;

module.exports = async function () {
  /** Deleting old test data */
  await mongoose.connect(uri);
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
};

export {};
