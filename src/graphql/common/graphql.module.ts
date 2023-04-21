/**
 * Importing npm packages
 */
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Type } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { FastifyRequest, FastifyReply } from 'fastify';
import { applyMiddleware } from 'graphql-middleware';
import { rule, shield, allow } from 'graphql-shield';

/**
 * Importing user defined packages
 */
import { User, UserSession } from '@app/providers/database';
import { Logger } from '@app/providers/logger';
import { AppError, ErrorCode, ErrorUtils } from '@app/shared/errors';
import { AuthType } from '@app/shared/guards';
import { AuthService, AuthModule } from '@app/shared/modules';

/**
 * Defining types
 */

export interface GraphQLContext {
  req: FastifyRequest;
  res: FastifyReply;
  user?: User | null;
  session?: UserSession;
}

export interface GraphQLModuleOptions {
  /** Name of the GraphQL API. The value will result in the path being `/graphql/<name>` */
  name: string;

  /** An array of modules to scan when searching for resolvers */
  include: Type[];

  /** Determines whether the route is protected or not */
  requiredAuth?: AuthType;

  /** Determines whether to disable CSRF protection */
  disableCSRFProtection?: boolean;
}

/**
 * Declaring the constants
 */

export class GraphQLModule {
  static forRoot(options: GraphQLModuleOptions) {
    return NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [AuthService],
      useFactory(authService: AuthService) {
        const logger = Logger.getLogger(`graphql:${options.name}`);

        const csrfShield = rule('CSRF_SHIELD')(() => authService.verifyCSRFToken());
        const ruleTree = { Mutation: options.disableCSRFProtection === true ? allow : csrfShield };
        const permissions = shield(ruleTree, { allowExternalErrors: true, fallbackRule: allow });

        const context = async (req: FastifyRequest, res: FastifyReply) => {
          if (req.method === 'GET') return res.send(ErrorCode.R001.getFormattedError());

          const result = await authService.getUserFromCookie(req, res);
          if (options.requiredAuth === undefined) {
            authService.initCSRFToken(res);
            return { req, res, ...result };
          }

          /** Throwing resource not found error when required auth is admin */
          if (options.requiredAuth === AuthType.ADMIN && !result?.user.admin) return res.send(ErrorCode.R001.getFormattedError());
          if (!result) throw new AppError(ErrorCode.IAM002);
          if (options.requiredAuth === AuthType.VERIFIED && !result.user.verified) throw new AppError(ErrorCode.IAM003);
          return { req, res, ...result };
        };

        return {
          autoSchemaFile: true,
          autoTransformHttpErrors: false,
          buildSchemaOptions: { filterUnusedTypes: true },
          context: context,
          csrfPrevention: false,
          formatError: (formattedError, actualError) => ErrorUtils.formatGraphQLError(formattedError, actualError, logger),
          include: options.include,
          path: `/graphql/${options.name}`,
          transformSchema: schema => applyMiddleware(schema, permissions),
        };
      },
    });
  }
}
