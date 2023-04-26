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
const cache: Record<string, any> = {};

export class Utils {
  static sanitize<T>(obj: T[]): T[];
  static sanitize<T>(obj: T): T;
  static sanitize<T>(obj: T | T[]): T | T[] {
    if (Array.isArray(obj)) {
      const trimmedArr = [] as any[];
      for (const value of obj) {
        if (value === null || value === undefined) continue;
        const val = typeof value != 'object' ? value : Array.isArray(value) ? Utils.sanitize(value) : Utils.sanitize(value);
        trimmedArr.push(val);
      }
      return trimmedArr;
    }

    const trimmedObj = {} as any;
    for (const [key, value] of Object.entries(obj as object)) {
      if (value === null || value === undefined) continue;
      trimmedObj[key] = typeof value != 'object' ? value : Array.isArray(value) ? Utils.sanitize(value) : Utils.sanitize(value);
    }
    return trimmedObj;
  }

  static setCache<T>(key: string, value: T) {
    cache[key] = value;
    return this;
  }

  static getCache<T>(key: string): T | null {
    return cache[key] ?? null;
  }
}
