/**
 * Importing npm packages
 */

/**
 * Importing user defined packages
 */

/**
 * Importing and defining types
 */

type ExpandRecursively<T> = T extends object ? (T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never) : T;

type ExcludeNull<T> = ExpandRecursively<{ [K in keyof T]: Exclude<ExcludeNull<T[K]>, null> }>;

/**
 * Declaring the constants
 */

export class Utils {
  static excludeNull<T>(obj: T[]): ExcludeNull<T>[];
  static excludeNull<T extends object>(obj: T): ExcludeNull<T>;
  static excludeNull<T>(obj: T | T[]): ExcludeNull<T> | ExcludeNull<T>[] {
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
}
