/**
 * Importing npm packages
 */
import { Type } from '@nestjs/common';
import { ObjectType, registerEnumType, Field, Int } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

export interface PaginatedType<T> {
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
  abstract class Connection implements PaginatedType<T> {
    @Field(() => PageInfo, { description: 'Connection page details' })
    page: PageInfo;

    @Field(() => [classRef])
    items: T[];

    @Field(() => Int, { description: 'Total count' })
    totalCount: number;
  }

  return Connection as Type<PaginatedType<T>>;
}
