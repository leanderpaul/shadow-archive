/**
 * Importing npm packages
 */

import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@ObjectType()
export class FictionChapter {
  @Field(() => Int)
  index: number;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Boolean, { nullable: true })
  matureContent?: boolean;

  @Field()
  content: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}
