/**
 * Importing npm packages
 */
import { ArgsType, Field, ID, InputType, Int, PartialType, registerEnumType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { PageInput, SortOrder } from '@app/graphql/common';
import { FictionGenre, FictionStatus, FictionTier, FictionType } from '@app/shared/constants';

/**
 * Defining types
 */

export enum FictionSortField {
  TITLE = 'title',
  UPDATED_AT = 'updatedAt',
  CREATED_AT = 'createdAt',
  VIEWS = 'views',
  CHAPTER_COUNT = 'chapterCount',
}

/**
 * Declaring the constants
 */

registerEnumType(FictionTier, { name: 'FictionTier' });
registerEnumType(FictionSortField, { name: 'FictionSortField' });

@InputType()
export class FictionInput {
  @Field()
  name: string;

  @Field(() => FictionType)
  type: FictionType;

  @Field(() => FictionTier)
  tier: FictionTier;

  @Field({ nullable: true })
  coverUrl?: string;

  @Field(() => [FictionGenre])
  genres: FictionGenre[];

  @Field(() => [String])
  tags: string[];

  @Field(() => [String])
  authors: string[];

  @Field(() => Int, { nullable: true })
  publishYear?: number;

  @Field()
  desc: string;

  @Field(() => FictionStatus, { nullable: true })
  status?: FictionStatus;
}

@ArgsType()
export class GetFictionArgs {
  @Field(() => ID)
  fid: string;
}

@InputType()
export class FictionFilter {
  @Field({ nullable: true })
  name?: string;

  @Field(() => FictionType, { nullable: true })
  type?: FictionType;

  @Field(() => FictionStatus, { nullable: true })
  status?: FictionStatus;

  @Field(() => FictionGenre, { nullable: true })
  genre?: FictionGenre;

  @Field({ nullable: true })
  tag?: string;

  @Field({ nullable: true })
  author?: string;
}

@InputType()
export class FictionSort {
  @Field(() => FictionSortField)
  field = FictionSortField.TITLE;

  @Field(() => SortOrder, { nullable: true })
  order = SortOrder.ASC;
}

@ArgsType()
export class FictionQueryArgs {
  @Field(() => FictionFilter, { nullable: true })
  filter?: FictionFilter;

  @Field(() => FictionSort, { nullable: true })
  sort: FictionSort = { field: FictionSortField.TITLE, order: SortOrder.ASC };

  @Field(() => PageInput, { nullable: true })
  page: PageInput = { offset: 0, limit: 20 };
}

@InputType()
class UpdateFictionInput extends PartialType(FictionInput) {}

@ArgsType()
export class UpdateFictionArgs extends GetFictionArgs {
  @Field(() => UpdateFictionInput)
  update: UpdateFictionInput;
}
