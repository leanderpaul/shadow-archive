/**
 * Importing npm packages
 */
import { Args, Mutation, Resolver } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { MemoirService } from '@app/modules/chronicle';
import { UseAuthGuard } from '@app/shared/decorators';

import { AddExerciseArgs, DeleteArgs, UpdateExerciseArgs } from './dto';
import { Exercise } from './memoir.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
@UseAuthGuard()
export class ExerciseResolver {
  constructor(private readonly memoirService: MemoirService) {}

  @Mutation(() => Exercise)
  async addExerciseRecord(@Args() args: AddExerciseArgs): Promise<Exercise> {
    return await this.memoirService.addMemoirField(args.date, 'exercises', args.input);
  }

  @Mutation(() => Exercise)
  async updateExerciseRecord(@Args() args: UpdateExerciseArgs): Promise<Exercise> {
    return await this.memoirService.updateMemoirField(args.date, 'exercises', args.index, args.update);
  }

  @Mutation(() => Exercise)
  async deleteExerciseRecord(@Args() args: DeleteArgs): Promise<Exercise> {
    return await this.memoirService.deleteMemoirField(args.date, 'exercises', args.index);
  }
}
