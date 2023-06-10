/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLModule } from '@app/graphql/common';

import { ChronicleMetadataModule, ChronicleMetadataResolver } from './chronicle-metadata';
import { ExpenseModule, ExpenseResolver } from './expense';
import { InsightModule, InsightResolver } from './insight';
import { MemoirModule, MemoirResolver } from './memoir';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const chronicleResolvers = [ChronicleMetadataResolver, ExpenseResolver, MemoirResolver, InsightResolver];

@Module({
  imports: [ChronicleMetadataModule, ExpenseModule, MemoirModule, InsightModule],
})
class ChronicleModule {}

@Module({
  imports: [GraphQLModule.forRoot({ name: 'chronicle', include: [ChronicleModule] }), ChronicleModule],
})
export class ChronicleGraphQLModule {}
