/**
 * Importing npm packages
 */
import { type GraphQLResolveInfo, Kind, type SelectionSetNode } from 'graphql';

/**
 * Importing user defined packages
 */
import { type Projection } from '@app/shared/interfaces';

import { PageInput } from './dto';
import { type PaginatedType } from './entities';

/**
 * Defining types
 */

export interface PaginationResolvers<T extends object, U extends PaginatedType<T>> {
  getItems(projection: Projection<T>): Promise<U['items']>;
  getCount(): Promise<number>;
}

/**
 * Declaring the constants
 */

export class GraphQLService {
  private getProjectionSelectionSetNode<T extends object>(node: SelectionSetNode, info: GraphQLResolveInfo, aliases?: Record<string, string>): Projection<T> {
    let fields = {} as Projection<any>;
    for (const selectionNode of node.selections) {
      if (selectionNode.kind === Kind.FIELD) {
        const value = selectionNode.selectionSet ? this.getProjectionSelectionSetNode<T>(selectionNode.selectionSet, info, aliases) : 1;
        let key = selectionNode.name.value;
        if (aliases?.[key]) key = aliases[key] as string;
        fields[key] = value;
      } else if (selectionNode.kind === Kind.FRAGMENT_SPREAD) {
        const fragmentName = selectionNode.name.value;
        const fragment = info.fragments[fragmentName];
        const fragmentFields = fragment ? this.getProjectionSelectionSetNode(fragment.selectionSet, info, aliases) : {};
        fields = { ...fields, ...fragmentFields };
      }
    }
    return fields;
  }

  getProjection<T extends object = any>(info: GraphQLResolveInfo, aliases?: Record<string, string>): Projection<T> {
    const node = info.fieldNodes[0]?.selectionSet;
    return node ? this.getProjectionSelectionSetNode<T>(node, info, aliases) : {};
  }

  async getPaginationResult<T extends object, U extends PaginatedType<T>>(info: GraphQLResolveInfo, page: PageInput, resolvers: PaginationResolvers<T, U>): Promise<U> {
    /** Validations */
    PageInput.isValid(page);

    const promises = [] as Promise<unknown>[];
    const result = {} as Partial<U>;
    const projection = this.getProjection<U>(info);

    if (projection.items) {
      const promise = resolvers.getItems(projection.items as any).then(items => (result.items = items));
      promises.push(promise);
    }

    if (projection.page || projection.totalCount) {
      const promise = resolvers.getCount().then(count => (result.totalCount = count));
      promises.push(promise);
    }

    await Promise.all(promises);
    if (projection.page && result.totalCount != undefined) {
      const hasPrev = page.offset > 0;
      const hasNext = result.totalCount > page.offset + page.limit;
      result.page = { hasPrev, hasNext };
    }

    return result as U;
  }
}
