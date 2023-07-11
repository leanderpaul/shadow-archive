/**
 * Importing npm packages
 */
import { Field, GraphQLISODateTime, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Types } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Paginated } from '@app/graphql/common';
import { FictionGenre, FictionStatus, FictionType, FictionWebsite } from '@app/modules/database';

import { FictionChapter } from './fiction-chapter';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

registerEnumType(FictionWebsite, { name: 'FictionWebsite' });
registerEnumType(FictionGenre, { name: 'FictionGenre' });
registerEnumType(FictionStatus, { name: 'FictionStatus' });
registerEnumType(FictionType, { name: 'FictionType' });

@ObjectType()
export class FictionVolume {
  @Field()
  name: string;

  @Field(() => Int)
  chapterCount: number;
}

@ObjectType()
export class FictionSource {
  @Field()
  sfid: string;

  @Field(() => FictionWebsite)
  website: FictionWebsite;

  @Field({ nullable: true })
  query?: string;
}

@ObjectType()
export class Fiction {
  @Field(() => ID)
  fid: Types.ObjectId;

  @Field()
  name: string;

  @Field(() => FictionType)
  type: FictionType;

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

  @Field(() => Int)
  views: number;

  @Field(() => FictionStatus)
  status: FictionStatus;

  @Field(() => Int)
  chapterCount: number;

  @Field(() => [FictionVolume], { nullable: true })
  volumes?: FictionVolume[];

  @Field(() => [FictionSource], { nullable: true })
  sources: FictionSource[];

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;

  @Field(() => [FictionChapter])
  chapters: FictionChapter[];

  @Field(() => FictionChapter, { nullable: true })
  chapter?: FictionChapter;
}

@ObjectType()
export class FictionConnection extends Paginated(Fiction) {}
