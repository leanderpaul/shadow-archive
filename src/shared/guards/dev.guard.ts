/**
 * Importing npm packages
 */
import { mixin } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';
import { type CanActivate, type Guard } from '@app/shared/interfaces';
import { Config } from '@app/shared/services';

import { Role, RoleGuard, Service } from './role.guard';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */
const cache: Partial<Record<string, Guard>> = {};

function createDevGuard(): Guard;
function createDevGuard(service: Service, role: Role): Guard;
function createDevGuard(service?: Service, role?: Role): Guard {
  if (service === undefined || role === undefined) {
    class DevGuard implements CanActivate {
      canActivate(): boolean {
        const isDev = Config.get('app.env') === 'development';
        if (!isDev) throw new AppError(ErrorCode.R001);
        return true;
      }
    }
    return DevGuard;
  }

  class DevGuardMixin extends RoleGuard(service, role) {
    override canActivate(): boolean {
      const isDev = Config.get('app.env') === 'development';
      if (!isDev) return super.canActivate();
      return true;
    }
  }

  return mixin(DevGuardMixin);
}

export function DevGuard(): Guard;
export function DevGuard(service: Service, role: Role): Guard;
export function DevGuard(service?: Service, role?: Role): Guard {
  const onlyDevAccess = service === undefined || role === undefined;
  const key = onlyDevAccess ? '-' : `${service}:${role}`;
  const cachedResult = cache[key];
  if (cachedResult) return cachedResult;
  const result = onlyDevAccess ? createDevGuard() : createDevGuard(service, role);
  cache[key] = result;
  return result;
}
