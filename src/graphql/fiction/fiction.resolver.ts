/**
 * Importing npm packages
 */
import { Args, Info, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { type GraphQLResolveInfo } from 'graphql';

/**
 * Importing user defined packages
 */
import { GraphQLService, type PaginatedType } from '@app/graphql/common';
import { FictionChapterService, FictionService } from '@app/modules/fiction';
import { FictionRole } from '@app/shared/constants';
import { UseRoleGuard } from '@app/shared/decorators';

import { FictionChapter, FictionChapterQueryArgs } from './fiction-chapter';
import { FictionInput, FictionQueryArgs, GetFictionArgs, UpdateFictionArgs } from './fiction.dto';
import { Fiction, FictionConnection } from './fiction.entity';

/**
 * Defining types
 */

type ResolvedFiction = Omit<Fiction, 'chapter' | 'chapters'>;

type ResolvedFictionConnection = PaginatedType<ResolvedFiction>;

/**
 * Declaring the constants
 */

@Resolver(() => Fiction)
@UseRoleGuard('fiction', FictionRole.READER)
export class FictionResolver {
  constructor(private readonly fictionService: FictionService, private readonly fictionChapterService: FictionChapterService, private readonly graphqlService: GraphQLService) {}

  @Query(() => Fiction, { name: 'fiction', nullable: true })
  getFiction(@Info() info: GraphQLResolveInfo, @Args() args: GetFictionArgs): Promise<ResolvedFiction | null> {
    const projection = this.graphqlService.getProjection(info);
    return this.fictionService.getFiction(args.fid, projection);
  }

  @Query(() => FictionConnection, { name: 'fictions' })
  getFictionConnection(@Info() info: GraphQLResolveInfo, @Args() args: FictionQueryArgs): Promise<ResolvedFictionConnection> {
    return this.graphqlService.getPaginationResult(info, args.page, {
      getCount: () => this.fictionService.getFictionCount(args.filter),
      getItems: projection => this.fictionService.getFictionList(args, projection),
    });
  }

  @ResolveField(() => FictionChapter, { name: 'chapter', nullable: true })
  getFictionChapter(@Parent() parent: ResolvedFiction, @Info() info: GraphQLResolveInfo, @Args('index', { type: () => Int }) index: number): Promise<FictionChapter | null> {
    const projection = this.graphqlService.getProjection(info);
    return this.fictionChapterService.getChapter(parent.fid, index, projection);
  }

  @ResolveField(() => [FictionChapter], { name: 'chapters' })
  getFictionChapterList(@Parent() parent: ResolvedFiction, @Info() info: GraphQLResolveInfo, @Args() args: FictionChapterQueryArgs): Promise<FictionChapter[]> {
    const projection = this.graphqlService.getProjection(info);
    return this.fictionChapterService.listChapter(parent.fid, args, projection);
  }

  @UseRoleGuard('fiction', FictionRole.SCRAPER)
  @Mutation(() => Fiction)
  createFiction(@Args('input') input: FictionInput): Promise<ResolvedFiction> {
    return this.fictionService.createFiction(input);
  }

  @UseRoleGuard('fiction', FictionRole.SCRAPER)
  @Mutation(() => Fiction)
  updateFiction(@Args() args: UpdateFictionArgs): Promise<ResolvedFiction> {
    return this.fictionService.updateFiction(args.fid, args.update);
  }

  @UseRoleGuard('fiction', FictionRole.SCRAPER)
  @Mutation(() => Boolean)
  async deleteFiction(@Args() args: GetFictionArgs): Promise<boolean> {
    await this.fictionService.deleteFiction(args.fid);
    return true;
  }
}
