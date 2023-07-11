/**
 * Importing npm packages
 */
import { type SortOrder } from 'mongoose';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export interface PageCursor {
  limit: number;
  offset: number;
}

export interface PageSort<T> {
  field: T;
  order: SortOrder;
}
