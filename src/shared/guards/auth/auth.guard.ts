/**
 * Importing npm packages
 */
import { ExecutionContext, mixin, Injectable, Type, CanActivate } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';
import { AuthService } from '@app/shared/modules';
import { Utils } from '@app/shared/utils';

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

export const AuthGuard = Utils.memorize(createAuthGuard);

function createAuthGuard(requiredAuth: AuthType = AuthType.VERIFIED): Type<CanActivate> {
  @Injectable()
  class MixinAuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<FastifyRequest>();
      const response = context.switchToHttp().getResponse<FastifyReply>();

      const result = await this.authService.getUserFromCookie(request, response);
      if (requiredAuth === AuthType.ADMIN && (!result || !result.user.admin)) {
        response.send(ErrorCode.R001.getFormattedError());
        return false;
      }
      if (!result) throw new AppError(ErrorCode.IAM002);
      if (result.user && requiredAuth === AuthType.AUTHENTICATED) return true;

      if (requiredAuth === AuthType.VERIFIED) {
        if (!result.user.verified) throw new AppError(ErrorCode.IAM003);
        return true;
      }

      return false;
    }
  }

  return mixin(MixinAuthGuard);
}
