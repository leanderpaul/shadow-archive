/**
 * Importing npm packages
 */
import fs from 'fs';

import { type Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { printSchema } from 'graphql';

/**
 * Importing user defined packages
 */
import { accountsResolvers } from './accounts';
import { adminResolvers } from './admin';
import { chronicleResolvers } from './chronicle';

/**
 * Defining types
 */
import '@fastify/cookie';

/**
 * Declaring the constants
 */
const graphqlEndpoint: Record<string, Type[]> = {
  accounts: accountsResolvers,
  admin: adminResolvers,
  chronicle: chronicleResolvers,
};

async function generateSchema(): Promise<void> {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule, { logger: ['error', 'warn'] });
  await app.init();

  const rootDir = 'generated';
  try {
    fs.accessSync(rootDir);
  } catch (err) {
    fs.mkdirSync(rootDir);
  }

  const gqlSchemaFactory = app.get(GraphQLSchemaFactory);
  for (const [name, resolvers] of Object.entries(graphqlEndpoint)) {
    const schema = await gqlSchemaFactory.create(resolvers);
    const gqlSchemas = printSchema(schema);
    fs.writeFileSync(rootDir + `/${name}-schemas.gql`, gqlSchemas);
    console.log(`GraphQL schemas written to file '${rootDir}/${name}-schemas.gql'`); // eslint-disable-line no-console
  }

  app.close();
  console.log(`GraphQL Schema generated for all endpoints`); // eslint-disable-line no-console
}

generateSchema();
