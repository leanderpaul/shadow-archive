/**
 * Importing npm packages
 */
import { UseGuards } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AuthGuard, AuthType } from '@app/shared/guards';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const UseAuth = (authType: AuthType): MethodDecorator & ClassDecorator => UseGuards(AuthGuard(authType));

export { AuthType };
