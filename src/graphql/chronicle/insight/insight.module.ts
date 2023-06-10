/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { ChronicleModule } from '@app/modules/chronicle';

import { InsightResolver } from './insight.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [ChronicleModule],
  providers: [InsightResolver, GraphQLService],
})
export class InsightModule {}
