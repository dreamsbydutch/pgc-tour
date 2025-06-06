/**
 * Self-Contained Axiom Logging System
 * 
 * A comprehensive, production-ready logging solution with:
 * - Structured logging with category-specific methods
 * - Axiom integration for production monitoring
 * - Performance measurement utilities
 * - Development-specific logging tools
 * - Environment-aware behavior
 * - Robust error handling and retry logic
 * 
 * Usage Examples:
 * ```typescript
 * import { log, perf, dev } from '@/src/lib/logging';
 * 
 * // Category-specific logging
 * log.auth.info('User signed in', { userId: '123' });
 * log.api.request('GET', '/api/tournaments');
 * log.cache.invalidate('tournaments', 'user-action');
 * 
 * // Performance measurement
 * const timer = perf.start('Database query');
 * // ... do work
 * timer(); // Logs the duration
 * 
 * // Development logging
 * dev.log('Debug info', { state: 'testing' });
 * dev.table(dataObject);
 * ```
 */

// Main logger instance (primary export)
export { logger as log, logger } from './logger';

// Axiom logger class for advanced usage
export { AxiomLogger } from './axiom-logger';

// Utility functions
export { perf, dev } from './utils';

// Configuration utilities
export { 
  detectEnvironment, 
  getDefaultAxiomConfig, 
  validateAxiomConfig,
  createBaseContext
} from './config';

// Type exports
export type {
  LogContext,
  LogEntry,
  LogError,
  PerformanceEntry,
  AxiomConfig,
  LoggingEnvironment,
  CategoryLogger,
  AuthLogger,
  ApiLogger,
  CacheLogger,
  StoreLogger,
  TournamentLogger,
  MiddlewareLogger,
  ILogger
} from './types';

// Enum exports
export {
  LogLevel,
  LogCategory
} from './types';

// Default export for convenience
export { logger as default } from './logger';
