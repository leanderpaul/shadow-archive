/**
 * Importing npm packages
 */
import { ExecutionContext, mixin, Injectable, Type, CanActivate } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Importing user defined packages
 */
import { UserSession, User } from '@app/providers/database';
import { AppError, ErrorCode } from '@app/shared/errors';
import { AuthService } from '@app/shared/modules';
import { Utils } from '@app/shared/utils';

/**
 * Defining types
 */

export interface GraphQLContext {
  req: FastifyRequest;
  res: FastifyReply;
  user?: User | null;
  session?: UserSession;
}

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
