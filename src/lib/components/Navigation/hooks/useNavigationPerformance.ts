/**
 * Navigation Performance Monitoring Hook
 *
 * Monitors navigation performance and provides optimization insights
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface PerformanceMetrics {
  loadTime: number;
  apiCallCount: number;
  errorCount: number;
  retryCount: number;
  cacheHitRate: number;
  lastUpdated: Date;
}

interface PerformanceConfig {
  enabled?: boolean;
  logToConsole?: boolean;
  sampleRate?: number; // 0-1, percentage of sessions to monitor
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: process.env.NODE_ENV === "development",
  logToConsole: process.env.NODE_ENV === "development",
  sampleRate: 0.1, // 10% of sessions
};

/**
 * Hook for monitoring navigation performance
 */
export function useNavigationPerformance(config: PerformanceConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    apiCallCount: 0,
    errorCount: 0,
    retryCount: 0,
    cacheHitRate: 0,
    lastUpdated: new Date(),
  });

  const startTimeRef = useRef<number>(Date.now());
  const apiCallsRef = useRef<number>(0);
  const errorsRef = useRef<number>(0);
  const retriesRef = useRef<number>(0);
  const cacheHitsRef = useRef<number>(0);
  const totalRequestsRef = useRef<number>(0);

  // Determine if we should monitor this session
  const shouldMonitor = useRef<boolean>(
    Boolean(finalConfig.enabled) &&
      Math.random() < (finalConfig.sampleRate ?? 0.1),
  );

  const recordApiCall = useCallback(() => {
    if (!shouldMonitor.current) return;

    apiCallsRef.current += 1;
    totalRequestsRef.current += 1;
  }, []);

  const recordCacheHit = useCallback(() => {
    if (!shouldMonitor.current) return;

    cacheHitsRef.current += 1;
    totalRequestsRef.current += 1;
  }, []);

  const recordError = useCallback(() => {
    if (!shouldMonitor.current) return;

    errorsRef.current += 1;
  }, []);

  const recordRetry = useCallback(() => {
    if (!shouldMonitor.current) return;

    retriesRef.current += 1;
  }, []);

  const updateMetrics = useCallback(() => {
    if (!shouldMonitor.current) return;

    const loadTime = Date.now() - startTimeRef.current;
    const cacheHitRate =
      totalRequestsRef.current > 0
        ? cacheHitsRef.current / totalRequestsRef.current
        : 0;

    const newMetrics: PerformanceMetrics = {
      loadTime,
      apiCallCount: apiCallsRef.current,
      errorCount: errorsRef.current,
      retryCount: retriesRef.current,
      cacheHitRate,
      lastUpdated: new Date(),
    };

    setMetrics(newMetrics);

    if (finalConfig.logToConsole) {
      console.group("🧭 Navigation Performance Metrics");
      console.log("Load Time:", `${loadTime}ms`);
      console.log("API Calls:", apiCallsRef.current);
      console.log("Errors:", errorsRef.current);
      console.log("Retries:", retriesRef.current);
      console.log("Cache Hit Rate:", `${(cacheHitRate * 100).toFixed(1)}%`);
      console.groupEnd();
    }
  }, [finalConfig.logToConsole]);

  // Performance observer for navigation timing
  useEffect(() => {
    if (!shouldMonitor.current || typeof window === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;
          if (finalConfig.logToConsole) {
            console.log("Navigation Timing:", {
              domContentLoaded:
                navEntry.domContentLoadedEventEnd -
                navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ["navigation"] });

    return () => observer.disconnect();
  }, [finalConfig.logToConsole]);

  // Update metrics periodically
  useEffect(() => {
    if (!shouldMonitor.current) return;

    const interval = setInterval(updateMetrics, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Performance warnings
  useEffect(() => {
    if (!shouldMonitor.current || !finalConfig.logToConsole) return;

    const { loadTime, apiCallCount, errorCount, cacheHitRate } = metrics;

    if (loadTime > 3000) {
      console.warn("🐌 Navigation load time is high:", `${loadTime}ms`);
    }

    if (apiCallCount > 5) {
      console.warn("📡 High number of API calls detected:", apiCallCount);
    }

    if (errorCount > 2) {
      console.warn("❌ Multiple navigation errors detected:", errorCount);
    }

    if (cacheHitRate < 0.5 && totalRequestsRef.current > 3) {
      console.warn(
        "💾 Low cache hit rate:",
        `${(cacheHitRate * 100).toFixed(1)}%`,
      );
    }
  }, [metrics, finalConfig.logToConsole]);

  return {
    metrics,
    recordApiCall,
    recordCacheHit,
    recordError,
    recordRetry,
    isMonitoring: shouldMonitor.current,
  };
}
