/**
 * Importing npm packages
 */
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

/**
 * Importing user defined packages
 */
import { Config } from '@app/config';
import { Logger, Context } from '@app/providers';
import { AppError } from '@app/shared/errors';

import { AccountsModule } from './accounts';
import { ChronicleModule } from './chronicle';
import { StatusModule } from './status';

/**
 * Importing and defining types
 */
import type { ApolloDriverConfig } from '@nestjs/apollo';
import type { User, UserSession } from '@app/providers';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GraphQLFormattedError } from 'graphql';

export interface GraphQLContext {
  req: FastifyRequest;
  res: FastifyReply;
  user?: User | null;
  session?: UserSession;
}

/**
 * Declaring the constants
 */
const logger = Logger.getLogger('graphql');

/** Formatting the GraphQL Errors */
function formatError(formattedError: GraphQLFormattedError, error: unknown) {
  const obj = { ...formattedError };
  if (!obj.extensions) obj.extensions = { rid: Context.getRID() };

  if (error instanceof GraphQLError) error = error.originalError;

  const { msg, ...extensions } = error instanceof AppError ? error.getFormattedError() : AppError.formatError(error);
  obj.message = msg;
  obj.extensions = { ...obj.extensions, ...extensions };

  if (extensions.code === 'UNEXPECTED_SERVER_ERROR') logger.error(error);
  else logger.warn(msg, extensions);

  return obj;
}

const ApolloGraphQLModule = NestGraphQLModule.forRoot<ApolloDriverConfig>({
  autoSchemaFile: true,
  autoTransformHttpErrors: false,
  context: (req: FastifyRequest, res: FastifyReply) => ({ req, res }),
  driver: ApolloDriver,
  formatError,
  playground: false,
  plugins: Config.get('IS_DEV_SERVER') ? [ApolloServerPluginLandingPageLocalDefault()] : [],
  sortSchema: true,
});

@Module({
  imports: [ApolloGraphQLModule, StatusModule, AccountsModule, ChronicleModule],
  providers: [],
})
export class GraphQLModule {}
