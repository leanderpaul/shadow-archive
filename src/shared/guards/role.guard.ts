/**
 * Importing npm packages
 */
import { mixin } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ArchiveRole, ChronicleRole, FictionRole, IAMRole } from '@app/shared/constants';
import { AppError, ErrorCode } from '@app/shared/errors';
import { Guard } from '@app/shared/interfaces/guard.interface';
import { Context } from '@app/shared/services';

import { AuthGuard, AuthType } from './auth.guard';

/**
 * Defining types
 */
export type Role = IAMRole | FictionRole | ChronicleRole | ArchiveRole;

export type Service = 'iam' | 'fiction' | 'chronicle' | 'archive';

/**
 * Declaring the constants
 */

const cache: Partial<Record<string, Guard>> = {};

function createRoleGuard(service: Service, role: Role): Guard {
  class RoleGuardMixin extends AuthGuard(AuthType.VERIFIED) {
    override canActivate(): boolean {
      super.canActivate();
      const user = Context.getCurrentUser(true);
      const userRole = user.role[service];
      if ((userRole & role) === 0) throw new AppError(ErrorCode.R001);
      return true;
    }
  }

  return mixin(RoleGuardMixin);
}

export function RoleGuard(service: Service, role: Role): Guard {
  const key = `${service}:${role}`;
  const cachedResult = cache[key];
  if (cachedResult) return cachedResult;
  const result = createRoleGuard(service, role);
  cache[key] = result;
  return result;
}
