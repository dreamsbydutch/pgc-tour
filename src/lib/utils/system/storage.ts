/**
 * @fileoverview Storage utilities for localStorage and sessionStorage
 * Provides type-safe, error-resistant storage operations with monitoring and quota management
 */

import { formatBytes } from "../core/primitives";

// ============================================================================
// TYPES
// ============================================================================

export type StorageType = "localStorage" | "sessionStorage";

export interface StorageOptions {
  /** Fallback value when parsing fails */
  fallback?: unknown;
  /** Enable debug logging */
  debug?: boolean;
}

export interface StorageStats {
  totalSize: number;
  itemCount: number;
  largestItem: { key: string; size: number } | null;
  quotaUsage: number; // 0-1 percentage
}

// ============================================================================
// STORAGE ACCESS
// ============================================================================

/**
 * Get storage instance safely (handles SSR)
 */
function getStorage(type: StorageType): Storage | null {
  if (typeof window === "undefined") return null;
  return type === "localStorage" ? localStorage : sessionStorage;
}

/**
 * Set item to storage with error handling and serialization
 */
export function setStorageItem<T = unknown>(
  key: string,
  value: T,
  type: StorageType = "localStorage",
  options: StorageOptions = {},
): boolean {
  const storage = getStorage(type);
  if (!storage) return false;

  try {
    const serialized = JSON.stringify(value);
    storage.setItem(key, serialized);

    if (options.debug) {
      console.log(`✅ Stored "${key}" in ${type}:`, value);
    }

    return true;
  } catch (error) {
    console.warn(`Failed to set ${type} item "${key}":`, error);
    return false;
  }
}

/**
 * Get item from storage with error handling and deserialization
 */
export function getStorageItem<T = unknown>(
  key: string,
  type: StorageType = "localStorage",
  options: StorageOptions = {},
): T | null {
  const storage = getStorage(type);
  if (!storage) return options.fallback as T | null;

  try {
    const item = storage.getItem(key);
    if (item === null) return null;

    const parsed = JSON.parse(item) as T;

    if (options.debug) {
      console.log(`📖 Retrieved "${key}" from ${type}:`, parsed);
    }

    return parsed;
  } catch (error) {
    console.warn(`Failed to get ${type} item "${key}":`, error);
    return options.fallback as T | null;
  }
}

/**
 * Remove item from storage
 */
export function removeStorageItem(
  key: string,
  type: StorageType = "localStorage",
  options: StorageOptions = {},
): boolean {
  const storage = getStorage(type);
  if (!storage) return false;

  try {
    storage.removeItem(key);

    if (options.debug) {
      console.log(`🗑️ Removed "${key}" from ${type}`);
    }

    return true;
  } catch (error) {
    console.warn(`Failed to remove ${type} item "${key}":`, error);
    return false;
  }
}

/**
 * Check if key exists in storage
 */
export function hasStorageItem(
  key: string,
  type: StorageType = "localStorage",
): boolean {
  const storage = getStorage(type);
  if (!storage) return false;

  return storage.getItem(key) !== null;
}

// ============================================================================
// SIZE MONITORING
// ============================================================================

/**
 * Get the approximate size of storage in bytes
 */
export function getStorageSize(type: StorageType = "localStorage"): number {
  const storage = getStorage(type);
  if (!storage) return 0;

  try {
    let total = 0;
    for (const key in storage) {
      if (storage.hasOwnProperty(key)) {
        const value = storage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total;
  } catch (error) {
    console.warn(`Failed to calculate ${type} size:`, error);
    return 0;
  }
}

/**
 * Get the size of a specific storage item in bytes
 */
export function getStorageItemSize(
  key: string,
  type: StorageType = "localStorage",
): number {
  const storage = getStorage(type);
  if (!storage) return 0;

  try {
    const value = storage.getItem(key);
    if (!value) return 0;
    return key.length + value.length;
  } catch (error) {
    console.warn(`Failed to get size for key "${key}":`, error);
    return 0;
  }
}

// ============================================================================
// QUOTA MANAGEMENT
// ============================================================================

/**
 * Check if we're approaching storage quota (5MB typical limit)
 */
export function isApproachingQuota(
  type: StorageType = "localStorage",
  threshold: number = 0.8,
): boolean {
  const size = getStorageSize(type);
  const quotaLimit = 5 * 1024 * 1024; // 5MB
  const warningThreshold = quotaLimit * threshold;

  return size > warningThreshold;
}

/**
 * Get comprehensive storage statistics
 */
export function getStorageStats(
  type: StorageType = "localStorage",
): StorageStats {
  const storage = getStorage(type);
  if (!storage) {
    return {
      totalSize: 0,
      itemCount: 0,
      largestItem: null,
      quotaUsage: 0,
    };
  }

  const items: Array<{ key: string; size: number }> = [];
  let totalSize = 0;

  for (const key in storage) {
    if (storage.hasOwnProperty(key)) {
      const size = getStorageItemSize(key, type);
      items.push({ key, size });
      totalSize += size;
    }
  }

  const largestItem =
    items.length > 0
      ? items.reduce((max, item) => (item.size > max.size ? item : max))
      : null;

  const quotaLimit = 5 * 1024 * 1024; // 5MB
  const quotaUsage = totalSize / quotaLimit;

  return {
    totalSize,
    itemCount: items.length,
    largestItem,
    quotaUsage,
  };
}

/**
 * Clear storage items except for essential ones
 */
export function clearNonEssentialStorage(
  keepKeys: string[] = [],
  type: StorageType = "localStorage",
): number {
  const storage = getStorage(type);
  if (!storage) return 0;

  const essentialKeys = ["seasonal-data-storage", ...keepKeys];

  try {
    const keysToRemove: string[] = [];

    for (const key in storage) {
      if (storage.hasOwnProperty(key) && !essentialKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      storage.removeItem(key);
    });

    console.log(
      `🧹 Cleared ${keysToRemove.length} non-essential ${type} items`,
    );

    return keysToRemove.length;
  } catch (error) {
    console.warn(`Failed to clear non-essential ${type}:`, error);
    return 0;
  }
}

// ============================================================================
// DEBUGGING
// ============================================================================

/**
 * Log storage usage for debugging
 */
export function logStorageUsage(type: StorageType = "localStorage"): void {
  const storage = getStorage(type);
  if (!storage) return;

  console.group(`📊 ${type} Usage`);

  const stats = getStorageStats(type);
  console.log(`Total size: ${formatBytes(stats.totalSize)}`);
  console.log(`Item count: ${stats.itemCount}`);
  console.log(`Quota usage: ${(stats.quotaUsage * 100).toFixed(1)}%`);

  if (stats.largestItem) {
    console.log(
      `Largest item: ${stats.largestItem.key} (${formatBytes(stats.largestItem.size)})`,
    );
  }

  // Log individual items sorted by size
  const items: Array<{ key: string; size: number }> = [];
  for (const key in storage) {
    if (storage.hasOwnProperty(key)) {
      const size = getStorageItemSize(key, type);
      items.push({ key, size });
    }
  }

  items.sort((a, b) => b.size - a.size);
  items.forEach(({ key, size }) => {
    console.log(`  ${key}: ${formatBytes(size)}`);
  });

  if (isApproachingQuota(type)) {
    console.warn("⚠️ Approaching storage quota limit!");
  }

  console.groupEnd();
}

/**
 * Create a storage manager for a specific key prefix
 */
export function createStorageManager(
  prefix: string,
  type: StorageType = "localStorage",
) {
  const prefixedKey = (key: string) => `${prefix}:${key}`;

  return {
    set: <T>(key: string, value: T, options?: StorageOptions) =>
      setStorageItem(prefixedKey(key), value, type, options),

    get: <T>(key: string, options?: StorageOptions) =>
      getStorageItem<T>(prefixedKey(key), type, options),

    remove: (key: string, options?: StorageOptions) =>
      removeStorageItem(prefixedKey(key), type, options),

    has: (key: string) => hasStorageItem(prefixedKey(key), type),

    clear: () => {
      const storage = getStorage(type);
      if (!storage) return 0;

      let cleared = 0;
      const keysToRemove: string[] = [];

      for (const key in storage) {
        if (storage.hasOwnProperty(key) && key.startsWith(`${prefix}:`)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        storage.removeItem(key);
        cleared++;
      });

      return cleared;
    },

    getStats: () => {
      const storage = getStorage(type);
      if (!storage) return { size: 0, count: 0 };

      let size = 0;
      let count = 0;

      for (const key in storage) {
        if (storage.hasOwnProperty(key) && key.startsWith(`${prefix}:`)) {
          size += getStorageItemSize(key, type);
          count++;
        }
      }

      return { size, count };
    },
  };
}
