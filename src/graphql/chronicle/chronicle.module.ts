/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLModule } from '@app/graphql/common';
import { AuthType } from '@app/shared/guards';

import { ChronicleMetadataModule, ChronicleMetadataResolver } from './chronicle-metadata';
import { ExpenseModule, ExpenseResolver } from './expense';
import { MemoirModule, MemoirResolver } from './memoir';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export const chronicleResolvers = [ChronicleMetadataResolver, ExpenseResolver, MemoirResolver];

@Module({
  imports: [ChronicleMetadataModule, ExpenseModule, MemoirModule],
})
class ChronicleModule {}

@Module({
  imports: [GraphQLModule.forRoot({ name: 'chronicle', include: [ChronicleModule], requiredAuth: AuthType.VERIFIED }), ChronicleModule],
})
export class ChronicleGraphQLModule {}
