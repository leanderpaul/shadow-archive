/**
 * Importing npm packages
 */
import { CanActivate, Injectable, Type, mixin } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Importing user defined packages
 */
import { ConfigRecord } from '@app/config';
import { ContextService } from '@app/providers/context';
import { AppError, ErrorCode } from '@app/shared/errors';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const cache: Partial<Record<'true' | 'false', Type<CanActivate>>> = {};

function createDevGuard(allowAdmin: boolean): Type<CanActivate> {
  @Injectable()
  class MixinDevGuard implements CanActivate {
    constructor(private readonly contextService: ContextService, private readonly configService: ConfigService<ConfigRecord>) {}

    canActivate() {
      const isDev = this.configService.get('IS_DEV_SERVER');
      if (isDev) return true;

      const user = this.contextService.getCurrentUser();
      if (!allowAdmin || !user?.admin) throw new AppError(ErrorCode.R001);

      return true;
    }
  }

  return mixin(MixinDevGuard);
}

export function DevGuard(allowAdmin = false) {
  const key = allowAdmin ? 'true' : 'false';
  const cachedResult = cache[key];
  if (cachedResult) return cachedResult;
  const result = createDevGuard(allowAdmin);
  cache[key] = result;
  return result;
}
