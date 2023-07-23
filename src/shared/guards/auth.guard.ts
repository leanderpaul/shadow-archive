/**
 * Importing npm packages
 */
import { mixin } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';
import { type CanActivate, type Guard } from '@app/shared/interfaces/guard.interface';
import { Context } from '@app/shared/services';

/**
 * Defining types
 */

export enum AuthType {
  VERIFIED,
  AUTHENTICATED,
}

/**
 * Declaring the constants
 */
const cache: Partial<Record<AuthType, Guard>> = {};

function createAuthGuard(requiredAuth: AuthType): Guard {
  class MixinAuthGuard implements CanActivate {
    canActivate(): boolean {
      const user = Context.getCurrentUser();
      if (!user) throw new AppError(ErrorCode.IAM002);
      if (requiredAuth === AuthType.VERIFIED && !user.verified) throw new AppError(ErrorCode.IAM003);
      return true;
    }
  }

  return mixin(MixinAuthGuard);
}

export function AuthGuard(requiredAuth: AuthType = AuthType.VERIFIED): Guard {
  const cachedResult = cache[requiredAuth];
  if (cachedResult) return cachedResult;
  const result = createAuthGuard(requiredAuth);
  cache[requiredAuth] = result;
  return result;
}
