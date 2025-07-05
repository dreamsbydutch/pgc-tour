/**
 * Essential array manipulation utilities
 * Consolidates the most commonly used array functions
 *
 * @fileoverview Core array operations for the golf tournament app
 * Focus on performance, type safety, and common use cases
 * Optimized for efficiency and minimal redundancy
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
  const groups = {} as Record<K, T[]>;
  for (const item of array) {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key]!.push(item);
  }
  return groups;
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
  const result: T[] = [];
  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
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
  if (array.length === 0) return [];

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
  return array.flat();
}

/**
 * Finds the intersection of two arrays (optimized with Set)
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Array of common items
 * @example
 * intersection([1, 2, 3], [2, 3, 4]) // [2, 3]
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  const set2 = new Set(array2);
  return array1.filter((item) => set2.has(item));
}

/**
 * Finds the difference between two arrays (optimized with Set)
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Array of items in array1 but not in array2
 * @example
 * difference([1, 2, 3], [2, 3, 4]) // [1]
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  const set2 = new Set(array2);
  return array1.filter((item) => !set2.has(item));
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
 * Creates an object from an array using key function
 * @param array - Array to convert
 * @param keyFn - Function to extract key
 * @returns Object with key-value pairs
 * @example
 * keyBy([{id: 1, name: 'A'}, {id: 2, name: 'B'}], item => item.id)
 * // { 1: {id: 1, name: 'A'}, 2: {id: 2, name: 'B'} }
 */
export function keyBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T> {
  const result = {} as Record<K, T>;
  for (const item of array) {
    const key = keyFn(item);
    result[key] = item;
  }
  return result;
}

/**
 * Type-safe check if array has any items
 * @param array - Array to check
 * @returns True if array has items (with type narrowing)
 * @example
 * hasItems([1, 2, 3]) // true (type is [number, ...number[]])
 * hasItems([]) // false
 */
export function hasItems<T>(array: T[]): array is [T, ...T[]] {
  return array.length > 0;
}

/**
 * Safely gets first item from array
 * @param array - Array to get first item from
 * @returns First item or undefined
 * @example
 * first([1, 2, 3]) // 1
 * first([]) // undefined
 */
export function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}

/**
 * Safely gets last item from array
 * @param array - Array to get last item from
 * @returns Last item or undefined
 * @example
 * last([1, 2, 3]) // 3
 * last([]) // undefined
 */
export function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Gets a random item from an array
 * @param array - Array to sample from
 * @returns Random item or undefined if empty
 * @example
 * sample([1, 2, 3]) // 2 (random)
 * sample([]) // undefined
 */
export function sample<T>(array: readonly T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gets multiple random items from an array (without replacement)
 * @param array - Array to sample from
 * @param count - Number of items to sample
 * @returns Array of random items
 * @example
 * sampleSize([1, 2, 3, 4, 5], 3) // [2, 4, 1] (random)
 */
export function sampleSize<T>(array: readonly T[], count: number): T[] {
  if (count <= 0 || array.length === 0) return [];
  if (count >= array.length) return [...array];

  const result: T[] = [];
  const used = new Set<number>();

  while (result.length < count) {
    const index = Math.floor(Math.random() * array.length);
    if (!used.has(index)) {
      used.add(index);
      result.push(array[index]!);
    }
  }

  return result;
}

/**
 * Shuffles an array (Fisher-Yates algorithm)
 * @param array - Array to shuffle
 * @returns New shuffled array
 * @example
 * shuffle([1, 2, 3, 4, 5]) // [3, 1, 5, 2, 4] (random)
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Counts occurrences of each unique value in array
 * @param array - Array to count
 * @param keyFn - Optional function to extract comparison key
 * @returns Object with counts
 * @example
 * count(['a', 'b', 'a', 'c', 'b']) // {a: 2, b: 2, c: 1}
 */
export function count<T>(
  array: readonly T[],
  keyFn?: (item: T) => string | number,
): Record<string | number, number> {
  const counts: Record<string | number, number> = {};

  for (const item of array) {
    const key = keyFn ? keyFn(item) : String(item);
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

/**
 * Checks if two arrays are equal (shallow comparison)
 * @param array1 - First array
 * @param array2 - Second array
 * @returns True if arrays are equal
 * @example
 * isEqual([1, 2, 3], [1, 2, 3]) // true
 * isEqual([1, 2], [1, 2, 3]) // false
 */
export function isEqual<T>(
  array1: readonly T[],
  array2: readonly T[],
): boolean {
  if (array1.length !== array2.length) return false;

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) return false;
  }

  return true;
}

/**
 * Finds index of item using key function
 * @param array - Array to search
 * @param keyFn - Function to extract comparison key
 * @param value - Value to find
 * @returns Index or -1 if not found
 * @example
 * findIndexBy([{id: 1}, {id: 2}], item => item.id, 2) // 1
 */
export function findIndexBy<T>(
  array: readonly T[],
  keyFn: (item: T) => unknown,
  value: unknown,
): number {
  for (let i = 0; i < array.length; i++) {
    if (keyFn(array[i]!) === value) return i;
  }
  return -1;
}
