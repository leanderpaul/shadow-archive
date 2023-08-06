/**
 * Importing npm packages
 */
import { Args, Mutation, Resolver } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { MemoirService } from '@app/modules/chronicle';
import { UseAuthGuard } from '@app/shared/decorators';

import { AddFoodArgs, DeleteArgs, UpdateFoodArgs } from './dto';
import { Food } from './memoir.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
@UseAuthGuard()
export class FoodResolver {
  constructor(private readonly memoirService: MemoirService) {}

  @Mutation(() => Food)
  async addFoodRecord(@Args() args: AddFoodArgs): Promise<Food> {
    return await this.memoirService.addMemoirField(null, args.date, 'foods', args.input);
  }

  @Mutation(() => Food)
  async updateFoodRecord(@Args() args: UpdateFoodArgs): Promise<Food> {
    return await this.memoirService.updateMemoirField(null, args.date, 'foods', args.index, args.update);
  }

  @Mutation(() => Food)
  async deleteFoodRecord(@Args() args: DeleteArgs): Promise<Food> {
    return await this.memoirService.deleteMemoirField(null, args.date, 'foods', args.index);
  }
}
