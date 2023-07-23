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

export enum IAMRole {
  USER = 1 << 0,
  ADMIN = IAMRole.USER | (1 << 1),
}

export enum UserActivityType {
  CHANGE_PASSWORD = 1,
  RESET_PASSWORD = 2,
}
