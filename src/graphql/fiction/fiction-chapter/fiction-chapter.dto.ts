/**
 * Importing npm packages
 */
import { ArgsType, Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { PageInput, SortOrder } from '@app/graphql/common';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@InputType()
class FictionChapterInput {
  @Field(() => Int, { nullable: true })
  index?: number;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Boolean, { nullable: true })
  matureContent?: boolean;

  @Field()
  content: string;
}

@ArgsType()
export class GetFictionChapterArgs {
  @Field(() => ID)
  fid: string;

  @Field(() => Int)
  index: number;
}

@ArgsType()
export class FictionChapterQueryArgs {
  @Field(() => SortOrder, { nullable: true })
  sortOrder = SortOrder.ASC;

  @Field(() => PageInput, { nullable: true })
  page?: PageInput;
}

@InputType()
class UpdateFictionChapterInput extends PartialType(FictionChapterInput) {}

@ArgsType()
export class AddFictionChapterArgs {
  @Field(() => ID)
  fid: string;

  @Field(() => FictionChapterInput)
  input: FictionChapterInput;
}

@ArgsType()
export class UpdateFictionChapterArgs extends GetFictionChapterArgs {
  @Field(() => UpdateFictionChapterInput)
  update: UpdateFictionChapterInput;
}
