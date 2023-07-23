/**
 * Importing npm packages
 */
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { type DynamicModule, type Type } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { GraphQLError, type ValidationRule } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import { allow, rule, shield } from 'graphql-shield';

/**
 * Importing user defined packages
 */
import { AuthModule, AuthService } from '@app/modules/auth';
import { AppError, ErrorCode, ErrorFilter } from '@app/shared/errors';
import { type Role, type Service } from '@app/shared/guards';
import { Config, Context, Storage } from '@app/shared/services';

/**
 * Defining types
 */

export interface GraphQLModuleOptions {
  /** Name of the GraphQL API. The value will result in the path being `/graphql/<name>` */
  name: string;

  /** Role required to allow introspection query in production */
  inspectionRole: [Service, Role];

  /** An array of modules to scan when searching for resolvers */
  include: Type[];

  /** Determines whether to disable CSRF protection */
  disableCSRFProtection?: boolean;
}

/**
 * Declaring the constants
 */

export class GraphQLModule {
  static forRoot(options: GraphQLModuleOptions): DynamicModule {
    return NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [AuthService],
      useFactory(authService: AuthService) {
        Storage.insert('graphql', options.name);
        const errorFilter = new ErrorFilter();
        const csrfShield = rule('CSRF_SHIELD')(() => authService.verifyCSRFToken().catch(err => errorFilter.toGraphQLError(err)));
        const ruleTree = { Mutation: options.disableCSRFProtection === true ? allow : csrfShield };
        const permissions = shield(ruleTree, { allowExternalErrors: true, fallbackRule: allow });

        const IntrospectionRule: ValidationRule = context => ({
          Field(node) {
            const isIntrospectionQuery = node.name.value === '__schema' || node.name.value === '__type';
            if (!isIntrospectionQuery) return;

            const isProd = Config.get('app.env') === 'production';
            const user = Context.getCurrentUser();
            const [service, role] = options.inspectionRole;
            if (isProd && (user ? (user.role[service] & role) === 0 : true)) {
              const appError = new AppError(ErrorCode.S003);
              const graphqlError = new GraphQLError(appError.getMessage(), { originalError: appError });
              context.reportError(graphqlError);
            }
          },
        });

        return {
          autoSchemaFile: true,
          autoTransformHttpErrors: false,
          buildSchemaOptions: { filterUnusedTypes: true },
          csrfPrevention: false,
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
