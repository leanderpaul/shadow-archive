/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

export class Utils {
  static excludeNull<T>(obj: T[]): T[];
  static excludeNull<T>(obj: T): T;
  static excludeNull<T>(obj: T | T[]): T | T[] {
    if (Array.isArray(obj)) {
      const trimmedArr = [] as any[];
      for (const value of obj) {
        if (value === null) continue;
        const val = typeof value != 'object' ? value : Array.isArray(value) ? Utils.excludeNull(value) : Utils.excludeNull(value);
        trimmedArr.push(val);
      }
      return trimmedArr;
    }

    const trimmedObj = {} as any;
    for (const [key, value] of Object.entries(obj as object)) {
      if (value === null) continue;
      trimmedObj[key] = typeof value != 'object' ? value : Array.isArray(value) ? Utils.excludeNull(value) : Utils.excludeNull(value);
    }
    return trimmedObj;
  }

  static memorize<T extends (value?: any) => any>(fn: T): T {
    const defaultKey = 'default';
    const cache: Record<string, T> = {};

    return function (input?: any) {
      const name = input ?? defaultKey;
      if (name in cache) return cache[name]!;
      const result = fn(input);
      cache[name] = result;
      return result;
    } as any;
  }
}
