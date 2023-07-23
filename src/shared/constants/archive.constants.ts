/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export enum ArchiveRole {
  NONE = 0,
  GRAPHIQL_VIEWER = 1 << 0,
  ADMIN = ArchiveRole.GRAPHIQL_VIEWER | (1 << 1),
}
