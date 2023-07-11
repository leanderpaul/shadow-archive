/**
 * Importing npm packages
 */
import { type CanActivate, type Type, mixin } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';
import { Context } from '@app/shared/services';

/**
 * Defining types
 */

export enum AuthType {
  VERIFIED,
  AUTHENTICATED,
  ADMIN,
}

/**
 * Declaring the constants
 */
const cache: Partial<Record<AuthType, Type<CanActivate>>> = {};

function createAuthGuard(requiredAuth: AuthType): Type<CanActivate> {
  class MixinAuthGuard implements CanActivate {
    canActivate(): boolean {
      const user = Context.getCurrentUser();
      if (!user) throw new AppError(ErrorCode.IAM002);
      if (requiredAuth === AuthType.ADMIN && !user.admin) throw new AppError(ErrorCode.IAM004);
      if (requiredAuth === AuthType.VERIFIED && !user.verified) throw new AppError(ErrorCode.IAM003);
      return true;
    }
  }

  return mixin(MixinAuthGuard);
}

export function AuthGuard(requiredAuth: AuthType = AuthType.VERIFIED): Type<CanActivate> {
  const cachedResult = cache[requiredAuth];
  if (cachedResult) return cachedResult;
  const result = createAuthGuard(requiredAuth);
  cache[requiredAuth] = result;
  return result;
}
