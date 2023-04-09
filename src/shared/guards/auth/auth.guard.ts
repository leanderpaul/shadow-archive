/**
 * Importing npm packages
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { EAuthType } from '@app/shared/decorators';
import { AppError, ErrorCode } from '@app/shared/errors';
import { AuthService } from '@app/shared/modules';

/**
 * Importing and defining types
 */
import type { UserSession, User } from '@app/providers';
import type { FastifyRequest, FastifyReply } from 'fastify';

export interface GraphQLContext {
  req: FastifyRequest;
  res: FastifyReply;
  user?: User | null;
  session?: UserSession;
}

/**
 * Declaring the constants
 */

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext<GraphQLContext>();
    const userType = this.reflector.getAllAndOverride<EAuthType>('auth-type', [context.getHandler(), context.getClass()]) ?? EAuthType.VERIFIED;

    if (ctx.user === undefined) {
      const result = await this.authService.getUserFromCookie(ctx.req, ctx.res);
      if (result) {
        ctx.user = result.user;
        ctx.session = result.session;
      } else ctx.user = null;
    }

    if (!ctx.user) throw new AppError(ErrorCode.IAM002);
    if (ctx.user && userType === EAuthType.AUTHENTICATED) return true;

    if (userType === EAuthType.VERIFIED) {
      if (!ctx.user.verified) throw new AppError(ErrorCode.IAM003);
      return true;
    }

    return false;
  }
}
