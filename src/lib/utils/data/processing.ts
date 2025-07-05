/**
 * Data processing utilities
 * Specialized functions for filtering, searching, and data manipulation
 *
 * @fileoverview Data operations that work with arrays but serve higher-level purposes
 * Moved from core arrays to maintain separation of concerns
 */

/**
 * Generic sort function with type safety
 * @param items - Items to sort
 * @param key - Key to sort by
 * @param direction - Sort direction
 * @returns Sorted array
 * @example
 * sortItems([{age: 25}, {age: 30}], 'age', 'asc') // [{age: 25}, {age: 30}]
 */
export function sortItems<T>(
  items: T[],
  key: keyof T,
  direction: "asc" | "desc" = "desc",
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal == null || bVal == null) return 0;

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * Generic filter function that applies multiple filter criteria
 * @param items - Items to filter
 * @param filters - Filter criteria object
 * @returns Filtered array
 * @example
 * filterItems([{status: 'active', type: 'A'}], {status: 'active'})
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
 * Generic search function with support for nested fields
 * @param items - Items to search
 * @param query - Search query
 * @param searchFields - Fields to search in
 * @returns Filtered array matching search query
 * @example
 * searchItems([{name: 'John', course: {name: 'Pine Valley'}}], 'pine', ['name', 'course.name'])
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
 * Generic count by field
 * @param items - Items to count
 * @param field - Field to count by
 * @returns Object with counts per field value
 * @example
 * countByField([{type: 'A'}, {type: 'B'}, {type: 'A'}], 'type') // {A: 2, B: 1}
 */
export function countByField<T>(
  items: T[],
  field: keyof T,
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const key = String(item[field]);
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

/**
 * Generic batch update function
 * @param items - Items to update
 * @param updates - Array of update operations
 * @returns Updated array
 * @example
 * batchUpdateItems([{id: '1', name: 'A'}], [{id: '1', updates: {name: 'B'}}])
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
 * Generic CRUD operations factory
 * @returns Object with CRUD operations
 * @example
 * const ops = createCrudOps<User>();
 * const user = ops.getById(users, '123');
 */
export function createCrudOps<T extends { id: string }>() {
  return {
    getById: (items: T[], id: string) => items.find((item) => item.id === id),

    getByIds: (items: T[], ids: string[]) =>
      items.filter((item) => ids.includes(item.id)),

    add: (items: T[], newItem: T) => [...items, newItem],

    update: (items: T[], id: string, updates: Partial<T>) =>
      items.map((item) => (item.id === id ? { ...item, ...updates } : item)),

    remove: (items: T[], id: string) => items.filter((item) => item.id !== id),

    batchUpdate: (
      items: T[],
      updates: Array<{ id: string; updates: Partial<T> }>,
    ) => batchUpdateItems(items, updates),
  };
}
