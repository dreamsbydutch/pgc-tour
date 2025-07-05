/**
 * @fileoverview localStorage size monitoring utilities
 * Helps track and prevent quota exceeded errors
 */

/**
 * Get the approximate size of localStorage in bytes
 */
export function getLocalStorageSize(): number {
  if (typeof window === "undefined") return 0;

  try {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total;
  } catch (e) {
    console.warn("Failed to calculate localStorage size:", e);
    return 0;
  }
}

/**
 * Get the size of a specific localStorage item in bytes
 */
export function getLocalStorageItemSize(key: string): number {
  if (typeof window === "undefined") return 0;

  try {
    const value = localStorage.getItem(key);
    if (!value) return 0;
    return key.length + value.length;
  } catch (e) {
    console.warn(`Failed to get size for key "${key}":`, e);
    return 0;
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if we're approaching localStorage quota (5MB typical limit)
 */
export function isApproachingQuota(): boolean {
  const size = getLocalStorageSize();
  const quotaLimit = 5 * 1024 * 1024; // 5MB
  const warningThreshold = quotaLimit * 0.8; // 80% of quota

  return size > warningThreshold;
}

/**
 * Log localStorage usage for debugging
 */
export function logLocalStorageUsage(): void {
  if (typeof window === "undefined") return;

  console.group("📊 localStorage Usage");

  const totalSize = getLocalStorageSize();
  console.log(`Total size: ${formatBytes(totalSize)}`);

  // Log individual items
  const items: Array<{ key: string; size: number }> = [];
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const size = getLocalStorageItemSize(key);
      items.push({ key, size });
    }
  }

  // Sort by size descending
  items.sort((a, b) => b.size - a.size);

  items.forEach(({ key, size }) => {
    console.log(`${key}: ${formatBytes(size)}`);
  });

  if (isApproachingQuota()) {
    console.warn("⚠️ Approaching localStorage quota limit!");
  }

  console.groupEnd();
}

/**
 * Clear localStorage items except for essential ones
 */
export function clearNonEssentialStorage(keepKeys: string[] = []): void {
  if (typeof window === "undefined") return;

  const essentialKeys = ["seasonal-data-storage", ...keepKeys];

  try {
    const keysToRemove: string[] = [];

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key) && !essentialKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log(
      `🧹 Cleared ${keysToRemove.length} non-essential localStorage items`,
    );
  } catch (e) {
    console.warn("Failed to clear non-essential storage:", e);
  }
}
