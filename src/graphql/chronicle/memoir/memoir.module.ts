/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { GraphQLService } from '@app/graphql/common';
import { ChronicleModule } from '@app/modules/chronicle';

import { ActivityResolver } from './activity.resolver';
import { ExerciseResolver } from './exercise.resolver';
import { FoodResolver } from './food.resolver';
import { MemoirResolver } from './memoir.resolver';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [ChronicleModule],
  providers: [MemoirResolver, ActivityResolver, FoodResolver, ExerciseResolver, GraphQLService],
})
export class MemoirModule {}
