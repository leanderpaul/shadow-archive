/**
 * Importing npm packages
 */
import { SetMetadata } from '@nestjs/common';

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */

export enum EAuthType {
  VERIFIED,
  AUTHENTICATED,
}

/**
 * Declaring the constants
 */

export const AuthType = (authType: EAuthType) => SetMetadata('auth-type', authType);
