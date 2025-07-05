/**
 * Object manipulation utilities
 * Safe, type-checked object operations for the golf tournament app
 *
 * @fileoverview Core object utilities consolidated from arrays.ts
 * Focus on performance, type safety, and common object operations
 * Optimized for efficiency and minimal redundancy
 */

/**
 * Picks specific properties from an object
 * @param obj - Object to pick from
 * @param keys - Keys to pick
 * @returns New object with only picked properties
 * @example
 * pick({a: 1, b: 2, c: 3}, ['a', 'c']) // {a: 1, c: 3}
 * pick(user, ['id', 'name']) // { id: 1, name: 'John' }
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omits specific properties from an object
 * @param obj - Object to omit from
 * @param keys - Keys to omit
 * @returns New object without omitted properties
 * @example
 * omit({a: 1, b: 2, c: 3}, ['b']) // {a: 1, c: 3}
 * omit(user, ['password', 'internalId']) // User without sensitive fields
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Deep clones an object or array
 * @param obj - Object to clone
 * @returns Deep cloned object
 * @example
 * deepClone({a: {b: 1}}) // {a: {b: 1}} (new references)
 * deepClone([{id: 1}, {id: 2}]) // New array with cloned objects
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(deepClone) as T;
  }

  if (typeof obj === "object") {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        (cloned as any)[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Merges two or more objects deeply
 * @param target - Target object
 * @param sources - Source objects to merge
 * @returns Merged object
 * @example
 * deepMerge({a: {b: 1}}, {a: {c: 2}}) // {a: {b: 1, c: 2}}
 * deepMerge(config, userConfig, overrides) // Merged configuration
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  const result = { ...target };

  for (const source of sources) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (
          sourceValue &&
          targetValue &&
          typeof sourceValue === "object" &&
          typeof targetValue === "object" &&
          !Array.isArray(sourceValue) &&
          !Array.isArray(targetValue)
        ) {
          result[key] = deepMerge(targetValue, sourceValue) as T[Extract<
            keyof T,
            string
          >];
        } else if (sourceValue !== undefined) {
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }
  }

  return result;
}

/**
 * Checks if an object is empty
 * @param obj - Object to check
 * @returns True if object is empty
 * @example
 * isEmpty({}) // true
 * isEmpty({a: 1}) // false
 * isEmpty([]) // true
 * isEmpty(null) // true
 */
export function isEmpty(obj: unknown): boolean {
  if (obj == null) return true;

  if (Array.isArray(obj) || typeof obj === "string") {
    return obj.length === 0;
  }

  if (typeof obj === "object") {
    return Object.keys(obj).length === 0;
  }

  return false;
}

/**
 * Gets a nested property value safely with type-safe key access
 * @param obj - Object to get from
 * @param key - Property key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Property value or default
 * @example
 * get({a: {b: 1}}, 'a') // {b: 1}
 * get(user, 'profile', {}) // User profile or empty object
 */
export function get<T, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue?: T[K],
): T[K] | typeof defaultValue {
  if (obj == null || typeof obj !== "object") {
    return defaultValue;
  }

  const value = obj[key];
  return value !== undefined ? value : defaultValue;
}

/**
 * Gets a nested property value safely using path notation
 * @param obj - Object to get from
 * @param path - Property path (dot notation)
 * @param defaultValue - Default value if path doesn't exist
 * @returns Property value or default
 * @example
 * getPath({a: {b: {c: 1}}}, 'a.b.c') // 1
 * getPath(user, 'profile.address.city', 'Unknown') // City or 'Unknown'
 */
export function getPath(
  obj: any,
  path: string,
  defaultValue?: unknown,
): unknown {
  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result == null || typeof result !== "object") {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
}

/**
 * Sets a nested property value safely using path notation
 * @param obj - Object to set in
 * @param path - Property path (dot notation)
 * @param value - Value to set
 * @returns Modified object
 * @example
 * setPath({}, 'a.b.c', 1) // {a: {b: {c: 1}}}
 */
export function setPath(obj: any, path: string, value: unknown): any {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (current[key] == null || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}

/**
 * Checks if an object has a specific property
 * @param obj - Object to check
 * @param key - Property key to check for
 * @returns True if object has the property
 * @example
 * hasProperty({a: 1, b: 2}, 'a') // true
 * hasProperty({a: 1}, 'c') // false
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Gets all keys of an object with proper typing
 * @param obj - Object to get keys from
 * @returns Array of object keys
 * @example
 * keys({a: 1, b: 2}) // ['a', 'b']
 */
export function keys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Gets all values of an object with proper typing
 * @param obj - Object to get values from
 * @returns Array of object values
 * @example
 * values({a: 1, b: 2}) // [1, 2]
 */
export function values<T extends Record<string, unknown>>(
  obj: T,
): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

/**
 * Gets all entries of an object with proper typing
 * @param obj - Object to get entries from
 * @returns Array of [key, value] pairs
 * @example
 * entries({a: 1, b: 2}) // [['a', 1], ['b', 2]]
 */
export function entries<T extends Record<string, unknown>>(
  obj: T,
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Filters object properties based on a predicate
 * @param obj - Object to filter
 * @param predicate - Function to test each property
 * @returns New object with filtered properties
 * @example
 * filterObject({a: 1, b: 2, c: 3}, ([k, v]) => v > 1) // {b: 2, c: 3}
 */
export function filterObject<T extends Record<string, unknown>>(
  obj: T,
  predicate: (entry: [keyof T, T[keyof T]]) => boolean,
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of entries(obj)) {
    if (predicate([key, value])) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Maps object values while preserving keys
 * @param obj - Object to map
 * @param mapper - Function to transform values
 * @returns New object with mapped values
 * @example
 * mapObject({a: 1, b: 2}, (v) => v * 2) // {a: 2, b: 4}
 */
export function mapObject<T extends Record<string, unknown>, U>(
  obj: T,
  mapper: (value: T[keyof T], key: keyof T) => U,
): Record<keyof T, U> {
  const result = {} as Record<keyof T, U>;

  for (const [key, value] of entries(obj)) {
    result[key] = mapper(value, key);
  }

  return result;
}
