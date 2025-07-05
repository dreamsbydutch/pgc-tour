/**
 * @fileoverview Generic data manipulation utilities for the seasonal store
 * Provides reusable functions for CRUD operations, filtering, and querying
 */

import { groupBy, unique, intersection, difference } from "./arrays";
import { formatMoney } from "./formatting";

/**
 * Generic filter function that applies multiple filter criteria
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
 * Generic sort function with type safety
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
 * Generic search function with support for nested fields
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
 * Generic batch update function
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
 * Generic CRUD operations
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

/**
 * Generic statistics calculator
 */
export function calculateStats(numbers: number[]) {
  if (numbers.length === 0)
    return { total: 0, average: 0, median: 0, min: 0, max: 0 };

  const sorted = [...numbers].sort((a, b) => a - b);
  const total = numbers.reduce((sum, n) => sum + n, 0);

  return {
    total,
    average: total / numbers.length,
    median: sorted[Math.floor(sorted.length / 2)] || 0,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
  };
}

/**
 * Generic count by field
 */
export function countByField<T>(
  items: T[],
  field: keyof T,
): Record<string, number> {
  const groups = groupBy(items, (item) => String(item[field]));
  return Object.fromEntries(
    Object.entries(groups).map(([key, values]) => [key, values.length]),
  );
}

export { groupBy, unique, intersection, difference };
