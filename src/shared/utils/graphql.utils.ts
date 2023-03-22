/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */
import { Kind } from 'graphql';

/**
 * Importing and defining types
 */
import type { GraphQLResolveInfo, SelectionSetNode } from 'graphql';

export type Projection<T extends object> = {
  [K in keyof T]?: T[K] extends object[] ? Projection<T[K][number]> : T[K] extends object ? Projection<T[K]> : 1;
};

/**
 * Declaring the constants
 */

function getProjectionSelectionSetNode<T extends object>(node: SelectionSetNode, info: GraphQLResolveInfo) {
  let fields = {} as Projection<any>;
  for (const selectionNode of node.selections) {
    if (selectionNode.kind === Kind.FIELD) {
      const key = selectionNode.name.value;
      const value = selectionNode.selectionSet ? getProjectionSelectionSetNode<T>(selectionNode.selectionSet, info) : 1;
      fields[key] = value;
    } else if (selectionNode.kind === Kind.FRAGMENT_SPREAD) {
      const fragmentName = selectionNode.name.value;
      const fragment = info.fragments[fragmentName];
      const fragmentFields = fragment ? getProjectionSelectionSetNode(fragment.selectionSet, info) : {};
      fields = { ...fields, ...fragmentFields };
    }
  }
  return fields;
}

export class GraphQLUtils {
  static getProjection<T extends object = any>(info: GraphQLResolveInfo): Projection<T> {
    const node = info.fieldNodes[0]?.selectionSet;
    return node ? getProjectionSelectionSetNode<T>(node, info) : {};
  }
}
