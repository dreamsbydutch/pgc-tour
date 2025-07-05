/**
 * @fileoverview Performance monitoring and optimization utilities
 * Provides tools for measuring execution time, memory usage, and performance profiling
 */

import { formatBytes } from "../core/primitives";

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceResult<T = unknown> {
  result: T;
  executionTime: number;
  averageTime?: number;
  totalTime?: number;
  iterations?: number;
}

export interface PerformanceProfile {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, string | number>;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
}

export interface PerformanceBenchmark {
  name: string;
  fastest: string;
  slowest: string;
  results: Array<{
    name: string;
    averageTime: number;
    opsPerSecond: number;
    relativeSpeed: number;
  }>;
}

// ============================================================================
// PERFORMANCE MEASUREMENT
// ============================================================================

/**
 * Performance testing helper - measures function execution time
 * Extracted from old-utils/test.ts
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  iterations: number = 1,
): PerformanceResult<T> {
  const times: number[] = [];
  let result: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;

  console.log(`Performance Test: ${name}`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average Time: ${averageTime.toFixed(2)}ms`);

  return {
    result: result!,
    executionTime: times[times.length - 1] || 0,
    averageTime,
    totalTime,
    iterations,
  };
}

/**
 * Measure async function performance
 */
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  iterations: number = 1,
): Promise<PerformanceResult<T>> {
  const times: number[] = [];
  let result: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;

  console.log(`Async Performance Test: ${name}`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average Time: ${averageTime.toFixed(2)}ms`);

  return {
    result: result!,
    executionTime: times[times.length - 1] || 0,
    averageTime,
    totalTime,
    iterations,
  };
}

/**
 * Simple execution time wrapper
 */
export function timeExecution<T>(fn: () => T): PerformanceResult<T> {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  return {
    result,
    executionTime: end - start,
  };
}

/**
 * Simple async execution time wrapper
 */
export async function timeAsyncExecution<T>(
  fn: () => Promise<T>,
): Promise<PerformanceResult<T>> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  return {
    result,
    executionTime: end - start,
  };
}

// ============================================================================
// PERFORMANCE PROFILING
// ============================================================================

const activeProfiles = new Map<string, PerformanceProfile>();

/**
 * Start a performance profile
 */
export function startProfile(
  name: string,
  tags?: Record<string, string | number>,
): void {
  const profile: PerformanceProfile = {
    name,
    startTime: performance.now(),
    tags,
  };

  activeProfiles.set(name, profile);
  console.time(name);
}

/**
 * End a performance profile and return results
 */
export function endProfile(name: string): PerformanceProfile | null {
  const profile = activeProfiles.get(name);
  if (!profile) {
    console.warn(`No active profile found for: ${name}`);
    return null;
  }

  profile.endTime = performance.now();
  profile.duration = profile.endTime - profile.startTime;

  activeProfiles.delete(name);
  console.timeEnd(name);

  return profile;
}

/**
 * Get all active profiles
 */
export function getActiveProfiles(): PerformanceProfile[] {
  return Array.from(activeProfiles.values());
}

/**
 * Clear all active profiles
 */
export function clearProfiles(): void {
  activeProfiles.clear();
}

// ============================================================================
// MEMORY MONITORING
// ============================================================================

/**
 * Get current memory usage (Chrome/Edge only)
 */
export function getMemoryInfo(): MemoryInfo | null {
  if (typeof window === "undefined") return null;

  // @ts-ignore - performance.memory is not in standard types
  const memory = (performance as any).memory;
  if (!memory) return null;

  const usedPercentage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usedPercentage,
  };
}

/**
 * Log current memory usage
 */
export function logMemoryUsage(): void {
  const memoryInfo = getMemoryInfo();
  if (!memoryInfo) {
    console.log("Memory monitoring not available in this browser");
    return;
  }

  console.group("🧠 Memory Usage");
  console.log(
    `Used: ${formatBytes(memoryInfo.usedJSHeapSize, { precision: 2 })}`,
  );
  console.log(
    `Total: ${formatBytes(memoryInfo.totalJSHeapSize, { precision: 2 })}`,
  );
  console.log(
    `Limit: ${formatBytes(memoryInfo.jsHeapSizeLimit, { precision: 2 })}`,
  );
  console.log(`Usage: ${memoryInfo.usedPercentage.toFixed(1)}%`);
  console.groupEnd();
}

// ============================================================================
// BENCHMARKING
// ============================================================================

/**
 * Compare performance of multiple functions
 */
export function benchmark(
  name: string,
  functions: Record<string, () => unknown>,
  iterations: number = 100,
): PerformanceBenchmark {
  console.group(`🏁 Benchmark: ${name}`);

  const results = Object.entries(functions).map(([funcName, func]) => {
    const { averageTime } = measurePerformance(funcName, func, iterations);
    const opsPerSecond = 1000 / (averageTime || 1);

    return {
      name: funcName,
      averageTime: averageTime || 0,
      opsPerSecond,
      relativeSpeed: 0, // Will be calculated after all results
    };
  });

  // Calculate relative speeds
  const fastestTime = Math.min(...results.map((r) => r.averageTime));
  results.forEach((result) => {
    result.relativeSpeed = fastestTime / result.averageTime;
  });

  // Sort by performance
  results.sort((a, b) => b.opsPerSecond - a.opsPerSecond);

  const fastest = results[0]?.name || "unknown";
  const slowest = results[results.length - 1]?.name || "unknown";

  console.log(`Fastest: ${fastest}`);
  console.log(`Slowest: ${slowest}`);
  console.groupEnd();

  return {
    name,
    fastest,
    slowest,
    results,
  };
}

// ============================================================================
// OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Simple debounce implementation for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Simple throttle implementation for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Simple memoization for performance optimization
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Create a performance-optimized delay function
 */
export function createDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Batch function calls for better performance
 */
export function batchCalls<T>(
  func: (items: T[]) => void,
  delay: number = 0,
): (item: T) => void {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  return (item: T) => {
    batch.push(item);

    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      if (batch.length > 0) {
        func([...batch]);
        batch = [];
      }
    }, delay);
  };
}
