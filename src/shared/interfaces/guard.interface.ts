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

export interface CanActivate {
  canActivate(): boolean;
}

/**
 * Guard
 */
export interface Guard extends Function {
  new (...args: any[]): CanActivate;
}
