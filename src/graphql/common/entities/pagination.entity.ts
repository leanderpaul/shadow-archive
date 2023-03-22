/**
 * Importing npm packages
 */
import { ObjectType, registerEnumType, Field, Int } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */
import type { Type } from '@nestjs/common';

export interface IPaginatedType<T> {
  page: PageInfo;
  items: T[];
  totalCount: number;
}

/**
 * Declaring the constants
 */

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

registerEnumType(SortOrder, { name: 'SortOrder' });

@ObjectType()
export class PageInfo {
  @Field({ description: 'Has previous page' })
  hasPrev: boolean;

  @Field({ description: 'Has next page' })
  hasNext: boolean;
}

export function Paginated<T>(classRef: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class Connection implements IPaginatedType<T> {
    @Field(() => PageInfo, { description: 'Connection page details' })
    page: PageInfo;

    @Field(() => [classRef])
    items: T[];

    @Field(() => Int, { description: 'Total count' })
    totalCount: number;
  }

  return Connection as Type<IPaginatedType<T>>;
}
