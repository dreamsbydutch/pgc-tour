/**
 * Performance Monitoring & Development Utilities
 * 
 * Provides enhanced performance measurement and development-specific logging
 * capabilities for the self-contained Axiom logging system.
 */

import { logger } from './logger';
import { LogCategory } from './types';
import type { LogContext, PerformanceEntry } from './types';
import { detectEnvironment } from './config';

const environment = detectEnvironment();

/**
 * Performance measurement utilities with enhanced tracking
 */
export const perf = {
  /**
   * Start a performance timer that returns a function to end timing
   */
  start: (operation: string, category: LogCategory = LogCategory.SYSTEM): (() => void) => {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();
    
    return () => {
      const duration = performance.now() - startTime;
      const perfEntry: PerformanceEntry = {
        operation,
        duration,
        success: true,
        timestamp: startTimestamp,
        category,
        metadata: {
          endTime: new Date().toISOString(),
          durationMs: duration,
        },
      };
      
      logger.system.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`, undefined, perfEntry as unknown as Record<string, unknown>);
    };
  },

  /**
   * Measure the execution time of a function or promise
   */
  measure: async <T>(
    operation: string, 
    fn: () => Promise<T> | T,
    category: LogCategory = LogCategory.SYSTEM,
    context?: LogContext
  ): Promise<T> => {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      const perfEntry: PerformanceEntry = {
        operation,
        duration,
        success: true,
        timestamp: startTimestamp,
        category,
        metadata: {
          endTime: new Date().toISOString(),
          durationMs: duration,
          resultType: typeof result,
        },
      };
      
      logger.system.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`, context, perfEntry as unknown as Record<string, unknown>);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.system.error(
        `Performance: ${operation} failed after ${duration.toFixed(2)}ms`, 
        error instanceof Error ? error : new Error(String(error)), 
        context
      );
      
      throw error;
    }
  },

  /**
   * Create a performance mark for timing groups of operations
   */
  mark: (name: string): void => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
      if (environment.isDevelopment) {
        logger.debug(`Performance mark: ${name}`);
      }
    }
  },

  /**
   * Measure between two performance marks
   */
  measureBetween: (name: string, startMark: string, endMark: string, context?: LogContext): void => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entry = performance.getEntriesByName(name, 'measure')[0];
        if (entry) {
          logger.system.info(`Performance measurement: ${name} took ${entry.duration.toFixed(2)}ms`, context, {
            duration: entry.duration,
            startMark,
            endMark,
          });
        }
      } catch (error) {
        logger.system.warn(`Failed to measure performance between marks: ${startMark} -> ${endMark}`, context, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  },
};

/**
 * Development-only logging utilities
 */
export const dev = {
  /**
   * Log development information (only in development mode)
   */
  log: (message: string, data?: unknown, context?: LogContext) => {
    if (environment.isDevelopment) {
      const metadata = typeof data === 'object' && data !== null ? 
        data as Record<string, unknown> : 
        { data };
      logger.debug(`[DEV] ${message}`, context, metadata);
    }
  },

  /**
   * Log development warnings (only in development mode)
   */
  warn: (message: string, data?: unknown, context?: LogContext) => {
    if (environment.isDevelopment) {
      const metadata = typeof data === 'object' && data !== null ? 
        data as Record<string, unknown> : 
        { data };
      logger.warn(`[DEV] ${message}`, context, metadata);
    }
  },

  /**
   * Log development errors (only in development mode)
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    if (environment.isDevelopment) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`[DEV] ${message}`, err, context);
    }
  },

  /**
   * Display data in a table format (browser console only)
   */
  table: (data: unknown, label?: string) => {
    if (environment.isDevelopment && environment.isClient && console.table) {
      if (label) {
        console.log(`🔍 [DEV] ${label}:`);
      }
      console.table(data);
    }
  },

  /**
   * Log a development assertion
   */
  assert: (condition: boolean, message: string, context?: LogContext) => {
    if (environment.isDevelopment && !condition) {
      logger.error(`[DEV ASSERTION FAILED] ${message}`, new Error('Assertion failed'), context);
      if (environment.isClient && console.assert) {
        console.assert(condition, message);
      }
    }
  },

  /**
   * Time a development operation
   */
  time: (label: string): (() => void) => {
    if (!environment.isDevelopment) {
      // No-op in production
      return function noOp(): void { /* no-op */ };
    }

    const startTime = performance.now();
    
    if (environment.isClient && console.time) {
      console.time(label);
    }

    return () => {
      const duration = performance.now() - startTime;
      
      if (environment.isClient && console.timeEnd) {
        console.timeEnd(label);
      }
      
      logger.debug(`[DEV TIMER] ${label}: ${duration.toFixed(2)}ms`, undefined, { duration });
    };
  },

  /**
   * Group related development logs
   */
  group: (label: string, collapsed = false): (() => void) => {
    if (!environment.isDevelopment || !environment.isClient) {
      // No-op when not in development or not on client
      return function noOp(): void { /* no-op */ };
    }

    if (collapsed && console.groupCollapsed) {
      console.groupCollapsed(`🔍 [DEV] ${label}`);
    } else if (console.group) {
      console.group(`🔍 [DEV] ${label}`);
    }

    return () => {
      if (console.groupEnd) {
        console.groupEnd();
      }
    };
  },
};
