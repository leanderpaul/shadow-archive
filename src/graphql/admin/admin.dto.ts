/**
 * Importing npm packages
 */
import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { PageInput, SortOrder } from '@app/graphql/common';

/**
 * Defining types
 */

export enum UserSortField {
  EMAIL = 'email',
  CREATED_DATE = 'createdAt',
  UPDATED_DATE = 'updatedAt',
}

/**
 * Declaring the constants
 */

registerEnumType(UserSortField, { name: 'UserSortField' });

@InputType()
export class UserSort {
  @Field(() => UserSortField)
  field: UserSortField;

  @Field(() => SortOrder, { defaultValue: SortOrder.ASC, nullable: true })
  order: SortOrder;
}

@ArgsType()
export class UserQuery {
  @Field({ nullable: true })
  email?: string;

  @Field(() => PageInput, { nullable: true })
  page: PageInput = { offset: 0, limit: 20 };

  @Field(() => UserSort, { nullable: true })
  sort: UserSort = { field: UserSortField.CREATED_DATE, order: SortOrder.DESC };
}
