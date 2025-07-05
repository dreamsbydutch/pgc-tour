/**
 * @fileoverview Array and object manipulation utilities
 * Provides functions for working with arrays, objects, and data structures
 */

/**
 * Groups array items by a key function
 * @param array - Array to group
 * @param keyFn - Function to extract grouping key
 * @returns Object with grouped items
 * @example
 * groupBy([{type: 'A', value: 1}, {type: 'B', value: 2}], item => item.type)
 * // { A: [{type: 'A', value: 1}], B: [{type: 'B', value: 2}] }
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key]!.push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * Removes duplicate items from an array
 * @param array - Array with potential duplicates
 * @param keyFn - Optional function to extract comparison key
 * @returns Array with unique items
 * @example
 * unique([1, 2, 2, 3]) // [1, 2, 3]
 * unique([{id: 1}, {id: 2}, {id: 1}], item => item.id) // [{id: 1}, {id: 2}]
 */
export function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Chunks an array into smaller arrays of specified size
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flattens a nested array by one level
 * @param array - Array to flatten
 * @returns Flattened array
 * @example
 * flatten([[1, 2], [3, 4], [5]]) // [1, 2, 3, 4, 5]
 */
export function flatten<T>(array: T[][]): T[] {
  return array.reduce((flat, item) => flat.concat(item), []);
}

/**
 * Finds the intersection of two arrays
 * @param array1 - First array
 * @param array2 - Second array
 * @param keyFn - Optional function to extract comparison key
 * @returns Array of common items
 * @example
 * intersection([1, 2, 3], [2, 3, 4]) // [2, 3]
 */
export function intersection<T>(
  array1: T[],
  array2: T[],
  keyFn?: (item: T) => unknown,
): T[] {
  if (!keyFn) {
    return array1.filter((item) => array2.includes(item));
  }

  const set2 = new Set(array2.map(keyFn));
  return array1.filter((item) => set2.has(keyFn(item)));
}

/**
 * Finds the difference between two arrays
 * @param array1 - First array
 * @param array2 - Second array
 * @param keyFn - Optional function to extract comparison key
 * @returns Array of items in array1 but not in array2
 * @example
 * difference([1, 2, 3], [2, 3, 4]) // [1]
 */
export function difference<T>(
  array1: T[],
  array2: T[],
  keyFn?: (item: T) => unknown,
): T[] {
  if (!keyFn) {
    return array1.filter((item) => !array2.includes(item));
  }

  const set2 = new Set(array2.map(keyFn));
  return array1.filter((item) => !set2.has(keyFn(item)));
}

/**
 * Gets a random item from an array
 * @param array - Array to pick from
 * @returns Random item or undefined if array is empty
 * @example
 * sample([1, 2, 3, 4, 5]) // 3 (random)
 */
export function sample<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gets multiple random items from an array
 * @param array - Array to pick from
 * @param count - Number of items to pick
 * @returns Array of random items
 * @example
 * sampleSize([1, 2, 3, 4, 5], 3) // [2, 4, 1] (random)
 */
export function sampleSize<T>(array: T[], count: number): T[] {
  if (count <= 0 || array.length === 0) return [];
  if (count >= array.length) return [...array];

  const result: T[] = [];
  const indices = new Set<number>();

  while (result.length < count) {
    const index = Math.floor(Math.random() * array.length);
    if (!indices.has(index)) {
      indices.add(index);
      result.push(array[index]!);
    }
  }

  return result;
}

/**
 * Partitions an array into two arrays based on a predicate
 * @param array - Array to partition
 * @param predicate - Function to test each item
 * @returns Tuple of [truthy items, falsy items]
 * @example
 * partition([1, 2, 3, 4], x => x % 2 === 0) // [[2, 4], [1, 3]]
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean,
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];

  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }

  return [truthy, falsy];
}

/**
 * Creates an object from an array using key and value functions
 * @param array - Array to convert
 * @param keyFn - Function to extract key
 * @param valueFn - Function to extract value (optional, defaults to item itself)
 * @returns Object with key-value pairs
 * @example
 * keyBy([{id: 1, name: 'A'}, {id: 2, name: 'B'}], item => item.id)
 * // { 1: {id: 1, name: 'A'}, 2: {id: 2, name: 'B'} }
 */
export function keyBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K,
  valueFn?: (item: T) => unknown,
): Record<K, unknown> {
  return array.reduce(
    (obj, item) => {
      const key = keyFn(item);
      obj[key] = valueFn ? valueFn(item) : item;
      return obj;
    },
    {} as Record<K, unknown>,
  );
}

/**
 * Picks specific properties from an object
 * @param obj - Object to pick from
 * @param keys - Keys to pick
 * @returns New object with only picked properties
 * @example
 * pick({a: 1, b: 2, c: 3}, ['a', 'c']) // {a: 1, c: 3}
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
      if (obj.hasOwnProperty(key)) {
        (cloned as any)[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Merges two objects deeply
 * @param target - Target object
 * @param source - Source object
 * @returns Merged object
 * @example
 * deepMerge({a: {b: 1}}, {a: {c: 2}}) // {a: {b: 1, c: 2}}
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
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
 * Gets a nested property value safely
 * @param obj - Object to get from
 * @param path - Property path (dot notation)
 * @param defaultValue - Default value if path doesn't exist
 * @returns Property value or default
 * @example
 * get({a: {b: {c: 1}}}, 'a.b.c') // 1
 * get({a: {b: {c: 1}}}, 'a.b.d', 'default') // 'default'
 */
export function get(obj: any, path: string, defaultValue?: unknown): unknown {
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
