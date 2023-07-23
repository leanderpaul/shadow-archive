/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { FictionModule } from '@app/modules/fiction';
import { FictionRole } from '@app/shared/constants';

import { FictionChapterResolver } from './fiction-chapter';
import { FictionResolver } from './fiction.resolver';
import { GraphQLModule, GraphQLService } from '../common';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [FictionModule],
  providers: [FictionResolver, FictionChapterResolver, GraphQLService],
})
class FictionTempModule {}

@Module({
  imports: [
    GraphQLModule.forRoot({
      name: 'fiction',
      include: [FictionTempModule],
      inspectionRole: ['fiction', FictionRole.ADMIN],
    }),
    FictionTempModule,
  ],
})
export class FictionGraphQLModule {}
