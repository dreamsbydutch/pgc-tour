/**
 * Data transformation utilities
 * Functions for filtering, searching, mapping, and transforming data structures
 */

/**
 * Advanced filter function that applies multiple filter criteria
 * Supports arrays, ranges, date ranges, boolean, and exact match filters
 */
export function filterItems<T>(items: T[], filters: Record<string, any>): T[] {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null) return true;

      const itemValue = (item as any)[key];

      // Handle array filters (e.g., status: ["upcoming", "current"])
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }

      // Handle range filters (e.g., { min: 100, max: 1000 })
      if (
        (typeof value === "object" && value.min !== undefined) ||
        value.max !== undefined
      ) {
        const numValue = Number(itemValue);
        if (value.min !== undefined && numValue < value.min) return false;
        if (value.max !== undefined && numValue > value.max) return false;
        return true;
      }

      // Handle date range filters
      if (typeof value === "object" && value.start && value.end) {
        const itemDate = new Date(itemValue);
        return itemDate >= value.start && itemDate <= value.end;
      }

      // Handle boolean filters
      if (typeof value === "boolean") {
        return Boolean(itemValue) === value;
      }

      // Handle exact match
      return itemValue === value;
    });
  });
}

/**
 * Text search function with support for nested fields
 * Searches across multiple fields including dot-notation nested fields
 */
export function searchItems<T>(
  items: T[],
  query: string,
  searchFields: (keyof T | string)[],
): T[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) => {
      let value: any;

      // Handle nested field access (e.g., 'course.name')
      if (typeof field === "string" && field.includes(".")) {
        const keys = field.split(".");
        value = item;
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined || value === null) break;
        }
      } else {
        value = item[field as keyof T];
      }

      return value && String(value).toLowerCase().includes(lowerQuery);
    }),
  );
}

/**
 * Batch update function for applying multiple updates efficiently
 * Updates multiple items by ID in a single pass
 */
export function batchUpdateItems<T extends { id: string }>(
  items: T[],
  updates: Array<{ id: string; updates: Partial<T> }>,
): T[] {
  const updateMap = new Map(updates.map((u) => [u.id, u.updates]));

  return items.map((item) => {
    const update = updateMap.get(item.id);
    return update ? { ...item, ...update } : item;
  });
}

/**
 * Transform array items using a mapping function
 * Preserves null/undefined values and handles arrays safely
 */
export function mapItems<T, U>(
  items: T[],
  mapper: (item: T, index: number) => U,
): U[] {
  return items.map(mapper);
}

/**
 * Transform object values while preserving keys
 * Applies transformation function to all object values
 */
export function mapObjectValues<T, U>(
  obj: Record<string, T>,
  mapper: (value: T, key: string) => U,
): Record<string, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, mapper(value, key)]),
  );
}

/**
 * Transform nested object structure by applying functions at different levels
 * Useful for normalizing API responses or restructuring data
 */
export function transformNested<T>(
  data: any,
  transformers: Record<string, (value: any) => any>,
): T {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => transformNested(item, transformers)) as T;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (transformers[key]) {
      result[key] = transformers[key](value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = transformNested(value, transformers);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Flatten nested array structure to specified depth
 * More controlled than native flat() with better type safety
 */
export function flattenArray<T>(items: any[], depth: number = 1): T[] {
  if (depth <= 0) return items;

  return items.reduce((acc, item) => {
    if (Array.isArray(item)) {
      acc.push(...flattenArray(item, depth - 1));
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

/**
 * Reshape array of objects into nested structure
 * Groups by specified keys and creates hierarchical data
 */
export function reshapeToNested<T extends Record<string, any>>(
  items: T[],
  groupKeys: string[],
): any {
  if (groupKeys.length === 0) return items;

  const [currentKey, ...remainingKeys] = groupKeys;
  if (!currentKey) return items;

  const groups: Record<string, T[]> = {};

  for (const item of items) {
    const keyValue = String(item[currentKey]);
    if (!groups[keyValue]) {
      groups[keyValue] = [];
    }
    groups[keyValue].push(item);
  }

  if (remainingKeys.length === 0) {
    return groups;
  }

  return Object.fromEntries(
    Object.entries(groups).map(([key, groupItems]) => [
      key,
      reshapeToNested(groupItems, remainingKeys),
    ]),
  );
}

/**
 * Normalize data by converting keys to consistent format
 * Useful for API response normalization
 */
export function normalizeKeys<T>(
  data: any,
  keyTransform: (key: string) => string,
): T {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => normalizeKeys(item, keyTransform)) as T;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = keyTransform(key);
    if (typeof value === "object" && value !== null) {
      result[newKey] = normalizeKeys(value, keyTransform);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Convert flat array with parent-child relationships to tree structure
 * Useful for building hierarchical menus or organization charts
 */
export function arrayToTree<T extends { id: string; parentId?: string }>(
  items: T[],
  rootId?: string,
): Array<T & { children: Array<T & { children: any[] }> }> {
  type TreeNode = T & { children: TreeNode[] };
  const itemMap = new Map<string, TreeNode>(
    items.map((item) => [item.id, { ...item, children: [] as TreeNode[] }]),
  );
  const roots: TreeNode[] = [];

  for (const item of items) {
    const treeItem = itemMap.get(item.id)!;

    if (!item.parentId || item.parentId === rootId) {
      roots.push(treeItem);
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(treeItem);
      }
    }
  }

  return roots;
}

/**
 * Convert tree structure to flat array with level indicators
 * Inverse of arrayToTree - useful for table display of hierarchical data
 */
export function treeToArray<T extends { children?: T[] }>(
  tree: T[],
  levelKey: string = "level",
  level: number = 0,
): Array<T & Record<string, number>> {
  const result: Array<T & Record<string, number>> = [];

  for (const node of tree) {
    const { children, ...nodeData } = node;
    result.push({ ...nodeData, [levelKey]: level } as T &
      Record<string, number>);

    if (children && children.length > 0) {
      result.push(...treeToArray(children, levelKey, level + 1));
    }
  }

  return result;
}
