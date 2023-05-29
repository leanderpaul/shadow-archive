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

class StorageService {
  private readonly store = new Map<string, any>();

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.store.get(key) || defaultValue;
  }

  set<T>(key: string, value: T): StorageService {
    this.store.set(key, value);
    return this;
  }

  insert<T>(key: string, value: T): StorageService {
    const array = this.get<T[]>(key);
    if (array) array.push(value);
    else this.set(key, [value]);
    return this;
  }

  remove<T>(key: string, value: T): void {
    const array = this.get<T[]>(key);
    if (array) {
      const updatedArray = array.filter(item => item != value);
      this.set(key, updatedArray);
    }
  }
}

const globalRef = global as any;
export const Storage: StorageService = globalRef.StorageService || (globalRef.StorageService = new StorageService());
