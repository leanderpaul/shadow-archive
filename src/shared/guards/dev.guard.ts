/**
 * Importing npm packages
 */
import { type CanActivate, type Type, mixin } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';
import { Config, Context } from '@app/shared/services';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const cache: Partial<Record<'true' | 'false', Type<CanActivate>>> = {};

function createDevGuard(allowAdmin: boolean): Type<CanActivate> {
  class MixinDevGuard implements CanActivate {
    canActivate() {
      const isDev = Config.get('app.env') === 'development';
      if (isDev) return true;

      const user = Context.getCurrentUser();
      if (!allowAdmin || !user?.admin) throw new AppError(ErrorCode.R001);

      return true;
    }
  }

  return mixin(MixinDevGuard);
}

export function DevGuard(allowAdmin = false): Type<CanActivate> {
  const key = allowAdmin ? 'true' : 'false';
  const cachedResult = cache[key];
  if (cachedResult) return cachedResult;
  const result = createDevGuard(allowAdmin);
  cache[key] = result;
  return result;
}
