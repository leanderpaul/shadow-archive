/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Injectable()
export class StatusService {
  getServerStatus() {
    return 'Server Working';
  }
}
