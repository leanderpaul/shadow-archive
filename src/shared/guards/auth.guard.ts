/**
 * Importing npm packages
 */
import { type CanActivate, type ExecutionContext, Injectable, type Type, mixin } from '@nestjs/common';
import { type FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { AppError, ErrorCode } from '@app/shared/errors';

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
  @Injectable()
  class MixinAuthGuard implements CanActivate {
    constructor(private readonly contextService: ContextService) {}

    canActivate(context: ExecutionContext): boolean {
      const response = context.switchToHttp().getResponse<FastifyReply>();

      const user = this.contextService.getCurrentUser();
      if (requiredAuth === AuthType.ADMIN && (!user || !user.admin)) {
        response.status(404).send(ErrorCode.R001.getFormattedError());
        return false;
      }
      if (!user) throw new AppError(ErrorCode.IAM002);
      if (requiredAuth === AuthType.VERIFIED && !user.verified) throw new AppError(ErrorCode.IAM003);

      return true;
    }
  }

  return mixin(MixinAuthGuard);
}

export function AuthGuard(requiredAuth: AuthType = AuthType.VERIFIED) {
  const cachedResult = cache[requiredAuth];
  if (cachedResult) return cachedResult;
  const result = createAuthGuard(requiredAuth);
  cache[requiredAuth] = result;
  return result;
}
