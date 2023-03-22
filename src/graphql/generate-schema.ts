/**
 * Importing npm packages
 */
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';

import fs from 'fs';
import { printSchema } from 'graphql';

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */

import type {} from '@fastify/cookie';

/**
 * Declaring the constants
 */

async function getResolvers(dir: string) {
  try {
    const imports = await import('./' + dir);
    const resolverNames = Object.keys(imports).filter(key => key.endsWith('Resolver'));
    return resolverNames.map(name => imports[name]);
  } catch (err) {
    console.error(`Error while importing src/graphql/${dir}`, err); // eslint-disable-line no-console
    return [];
  }
}

async function generateSchema() {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule, { logger: ['error', 'warn'] });
  await app.init();

  /** Loading the resolvers dynamically */
  const resolvers = [];
  const dirs = fs.readdirSync('src/graphql').filter(dir => !dir.includes('.') && dir != 'common');
  for (const dir of dirs) resolvers.push(...(await getResolvers(dir)));

  const gqlSchemaFactory = app.get(GraphQLSchemaFactory);
  const schema = await gqlSchemaFactory.create(resolvers);
  const gqlSchemas = printSchema(schema);

  const rootDir = 'generated';
  try {
    fs.accessSync(rootDir);
  } catch (err) {
    fs.mkdirSync(rootDir);
  }
  fs.writeFileSync(rootDir + '/schemas.gql', gqlSchemas);
  console.log(`GraphQL schemas written to file '${rootDir}/schemas.gql'`); // eslint-disable-line no-console
}

generateSchema();
