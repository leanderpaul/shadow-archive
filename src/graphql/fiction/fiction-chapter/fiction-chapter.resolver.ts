/**
 * Importing npm packages
 */
import { Args, Mutation, Resolver } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { FictionChapterService } from '@app/modules/fiction';

import { AddFictionChapterArgs, GetFictionChapterArgs, UpdateFictionChapterArgs } from './fiction-chapter.dto';
import { FictionChapter } from './fiction-chapter.entity';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
export class FictionChapterResolver {
  constructor(private readonly fictionChapterService: FictionChapterService) {}

  @Mutation(() => FictionChapter)
  addFictionChapter(@Args() args: AddFictionChapterArgs): Promise<FictionChapter> {
    return this.fictionChapterService.addChapter(args.fid, args.input);
  }

  @Mutation(() => FictionChapter)
  updateFictionChapter(@Args() args: UpdateFictionChapterArgs): Promise<FictionChapter> {
    return this.fictionChapterService.updateChapter(args.fid, args.index, args.update);
  }

  @Mutation(() => FictionChapter)
  deleteFictionChapter(@Args() args: GetFictionChapterArgs): Promise<FictionChapter> {
    return this.fictionChapterService.deleteChapter(args.fid, args.index);
  }
}
