// Data aggregation and statistical operations
// Extracted from old-utils/data.ts and enhanced with golf-specific aggregations

/**
 * Statistical and aggregation functions for data analysis
 * Focuses on mathematical operations and data summarization
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

export function sumBy<T>(items: T[], field: keyof T): number {
  return items.reduce((sum, item) => {
    const value = Number(item[field]) || 0;
    return sum + value;
  }, 0);
}

export function averageBy<T>(items: T[], field: keyof T): number {
  if (items.length === 0) return 0;
  return sumBy(items, field) / items.length;
}

export function maxBy<T>(items: T[], field: keyof T): T | undefined {
  if (items.length === 0) return undefined;

  return items.reduce((max, item) => {
    const maxValue = Number(max[field]) || 0;
    const itemValue = Number(item[field]) || 0;
    return itemValue > maxValue ? item : max;
  });
}

export function minBy<T>(items: T[], field: keyof T): T | undefined {
  if (items.length === 0) return undefined;

  return items.reduce((min, item) => {
    const minValue = Number(min[field]) || 0;
    const itemValue = Number(item[field]) || 0;
    return itemValue < minValue ? item : min;
  });
}

export function groupSum<T>(
  items: T[],
  groupField: keyof T,
  sumField: keyof T,
): Record<string, number> {
  const groups: Record<string, number> = {};

  for (const item of items) {
    const key = String(item[groupField]);
    const value = Number(item[sumField]) || 0;
    groups[key] = (groups[key] || 0) + value;
  }

  return groups;
}

export function groupAverage<T>(
  items: T[],
  groupField: keyof T,
  avgField: keyof T,
): Record<string, number> {
  const groups: Record<string, T[]> = {};

  for (const item of items) {
    const key = String(item[groupField]);
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(item);
  }

  const averages: Record<string, number> = {};
  for (const [key, groupItems] of Object.entries(groups)) {
    averages[key] = averageBy(groupItems, avgField);
  }

  return averages;
}

export function percentile(numbers: number[], p: number): number {
  if (numbers.length === 0) return 0;
  if (p < 0 || p > 100) throw new Error("Percentile must be between 0 and 100");

  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);

  if (Number.isInteger(index)) {
    return sorted[index] || 0;
  }

  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return (sorted[lower] || 0) * (1 - weight) + (sorted[upper] || 0) * weight;
}

export function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;

  return Math.sqrt(avgSquaredDiff);
}

export function variance(numbers: number[]): number {
  const stdDev = standardDeviation(numbers);
  return stdDev * stdDev;
}

export function mode(numbers: number[]): number[] {
  if (numbers.length === 0) return [];

  const counts: Record<number, number> = {};
  let maxCount = 0;

  for (const num of numbers) {
    counts[num] = (counts[num] || 0) + 1;
    maxCount = Math.max(maxCount, counts[num]!);
  }

  return Object.entries(counts)
    .filter(([, count]) => count === maxCount)
    .map(([num]) => Number(num));
}

export function frequency<T>(items: T[]): Map<T, number> {
  const freq = new Map<T, number>();

  for (const item of items) {
    freq.set(item, (freq.get(item) || 0) + 1);
  }

  return freq;
}
