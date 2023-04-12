/**
 * Importing npm packages
 */
import { UseGuards } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AuthGuard, AuthType } from '@app/shared/guards';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

export const UseAuth = (authType: AuthType) => UseGuards(AuthGuard(authType));

export { AuthType };
