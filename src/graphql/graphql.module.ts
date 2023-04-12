/**
 * Importing npm packages
 */
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { applyMiddleware } from 'graphql-middleware';
import { rule, shield, allow } from 'graphql-shield';

/**
 * Importing user defined packages
 */
import { ConfigModule } from '@app/config';
import { Logger } from '@app/providers';
import { AppError, ErrorCode, ErrorUtils } from '@app/shared/errors';
import { AuthService, AuthModule } from '@app/shared/modules';

import { AccountsModule } from './accounts';
import { ChronicleModule } from './chronicle';

/**
 * Importing and defining types
 */
import type { ConfigRecord } from '@app/config';
import type { User, UserSession } from '@app/providers';
import type { ApolloDriverConfig } from '@nestjs/apollo';
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

const ApolloGraphQLModule = NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  imports: [AuthModule, ConfigModule],
  inject: [AuthService, ConfigService],
  useFactory(authService: AuthService, configService: ConfigService<ConfigRecord>) {
    const logger = Logger.getLogger('graphql');

    const csrfShield = rule('CSRF_SHIELD')(async () => ((await authService.verifyCSRFToken()) ? true : new AppError(ErrorCode.IAM005)));
    const ruleTree = { Mutation: { '*': csrfShield, login: allow, register: allow } };
    const permissions = shield(ruleTree, { allowExternalErrors: true, fallbackRule: allow });

    return {
      autoSchemaFile: true,
      autoTransformHttpErrors: false,
      context: (req: FastifyRequest, res: FastifyReply) => ({ req, res }),
      formatError: (formattedError, actualError) => ErrorUtils.formatGraphQLError(formattedError, actualError, logger),
      playground: false,
      plugins: configService.get('IS_DEV_SERVER') ? [ApolloServerPluginLandingPageLocalDefault()] : [],
      sortSchema: true,
      transformSchema: schema => applyMiddleware(schema, permissions),
    };
  },
});

@Module({
  imports: [ApolloGraphQLModule, AccountsModule, ChronicleModule],
  providers: [],
})
export class GraphQLModule {}
