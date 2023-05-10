/**
 * Importing npm packages
 */
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { type Type } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { type FastifyReply, type FastifyRequest } from 'fastify';
import { GraphQLError, type ValidationContext, type ValidationRule } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import { allow, rule, shield } from 'graphql-shield';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { Context } from '@app/providers/context';
import { Logger } from '@app/providers/logger';
import { AppError, ErrorCode, ErrorUtils } from '@app/shared/errors';
import { AuthType } from '@app/shared/guards';
import { AuthModule, AuthService } from '@app/shared/modules';
import { Utils } from '@app/shared/utils';

/**
 * Defining types
 */

export interface GraphQLContext {
  req: FastifyRequest;
  res: FastifyReply;
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

const IntrospectionRule: ValidationRule = (context: ValidationContext) => ({
  Field(node) {
    const isIntrospectionQuery = node.name.value === '__schema' || node.name.value === '__type';
    if (!isIntrospectionQuery) return;

    const isProd = Config.get('IS_PROD_SERVER');
    const user = Context.getCurrentUser();
    if (isProd && !user?.admin) {
      const appError = new AppError(ErrorCode.S003);
      const graphqlError = new GraphQLError(appError.getMessage(), { originalError: appError });
      context.reportError(graphqlError);
    }
  },
});

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
          if (req.method === 'GET') return res.status(404).send(ErrorCode.R001.getFormattedError());

          const result = await authService.getCurrentUserContext(req, res);
          if (options.requiredAuth === undefined) return { req, res };

          /** Throwing resource not found error when required auth is admin */
          if (options.requiredAuth === AuthType.ADMIN && !result?.user.admin) return res.status(404).send(ErrorCode.R001.getFormattedError());
          if (!result) throw new AppError(ErrorCode.IAM002);
          if (options.requiredAuth === AuthType.VERIFIED && !result.user.verified) throw new AppError(ErrorCode.IAM003);
          return { req, res };
        };

        const registeredApps = Utils.getCache<string[]>('graphql') || [];
        Utils.setCache('graphql', [...registeredApps, options.name]);

        return {
          autoSchemaFile: true,
          autoTransformHttpErrors: false,
          buildSchemaOptions: { filterUnusedTypes: true },
          context: context,
          csrfPrevention: false,
          formatError: (formattedError, actualError) => ErrorUtils.formatGraphQLError(formattedError, actualError, logger),
          include: options.include,
          introspection: true,
          path: `/graphql/${options.name}`,
          playground: false,
          transformSchema: schema => applyMiddleware(schema, permissions),
          validationRules: [IntrospectionRule],
        };
      },
    });
  }
}
