/**
 * Importing npm packages
 */
import { ExecutionContext, mixin } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { AppError, ErrorCode } from '@app/shared/errors';
import { AuthService } from '@app/shared/modules';
import { Utils } from '@app/shared/utils';

/**
 * Importing and defining types
 */
import type { UserSession, User } from '@app/providers';
import type { Type, CanActivate } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';

export interface GraphQLContext {
  req: FastifyRequest;
  res: FastifyReply;
  user?: User | null;
  session?: UserSession;
}

export enum AuthType {
  VERIFIED,
  AUTHENTICATED,
}

/**
 * Declaring the constants
 */

export const AuthGuard = Utils.memorize(createAuthGuard);

function createAuthGuard(requiredAuth: AuthType = AuthType.VERIFIED): Type<CanActivate> {
  class MixinAuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const ctx = GqlExecutionContext.create(context).getContext<GraphQLContext>();

      if (ctx.user === undefined) {
        const result = await this.authService.getUserFromCookie(ctx.req, ctx.res);
        if (result) {
          ctx.user = result.user;
          ctx.session = result.session;
        } else ctx.user = null;
      }

      if (!ctx.user) throw new AppError(ErrorCode.IAM002);
      if (ctx.user && requiredAuth === AuthType.AUTHENTICATED) return true;

      if (requiredAuth === AuthType.VERIFIED) {
        if (!ctx.user.verified) throw new AppError(ErrorCode.IAM003);
        return true;
      }

      return false;
    }
  }

  return mixin(MixinAuthGuard);
}
