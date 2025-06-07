/**
 * Logging Types & Configuration
 * 
 * Comprehensive type definitions for the self-contained Axiom logging system.
 * Safe for both client and server environments.
 */

// Define log levels with numeric priorities for filtering
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Numeric priority mapping for log levels
export const LOG_LEVEL_PRIORITY = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
} as const;

// Define log categories for better organization
export enum LogCategory {
  AUTH = 'auth',
  CACHE = 'cache',
  API = 'api',
  DATABASE = 'database',
  TOURNAMENT = 'tournament',
  STORE = 'store',
  MIDDLEWARE = 'middleware',
  SYSTEM = 'system',
  GENERAL = 'general',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  BILLING = 'billing',
  NOTIFICATIONS = 'notifications'
}

// Emoji mapping for console output
export const CATEGORY_EMOJIS = {
  [LogCategory.AUTH]: '🔐',
  [LogCategory.TOURNAMENT]: '🏆',
  [LogCategory.API]: '🌐',
  [LogCategory.STORE]: '🔄',
  [LogCategory.MIDDLEWARE]: '🛡️',
  [LogCategory.DATABASE]: '🗄️',
  [LogCategory.CACHE]: '💾',
  [LogCategory.SYSTEM]: '⚙️',
  [LogCategory.GENERAL]: 'ℹ️',
  [LogCategory.PERFORMANCE]: '⚡',
  [LogCategory.SECURITY]: '🚨',
  [LogCategory.BILLING]: '💳',
  [LogCategory.NOTIFICATIONS]: '🔔'
} as const;

export const LEVEL_EMOJIS = {
  [LogLevel.ERROR]: '❌',
  [LogLevel.WARN]: '⚠️', 
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.FATAL]: '💀',
} as const;

// Log context interface for structured metadata
export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  environment?: 'development' | 'staging' | 'production';
  version?: string;
  [key: string]: unknown;
}

// Core log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: LogContext;
  error?: LogError;
  metadata?: Record<string, unknown>;
  environment?: string;
  version?: string;
}

// Error structure for logging
export interface LogError {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  cause?: unknown;
}

// Performance measurement structure
export interface PerformanceEntry {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: string;
  category: LogCategory;
  metadata?: Record<string, unknown>;
}

// Axiom logger configuration
export interface AxiomConfig {
  token?: string;
  dataset: string;
  orgId?: string;
  baseUrl?: string;
  batchSize?: number;
  flushInterval?: number;
  retryAttempts?: number;
  enableConsole?: boolean;
  minLogLevel?: LogLevel;
  maxBatchAge?: number;
}

// Environment configuration
export interface LoggingEnvironment {
  isDevelopment: boolean;
  isProduction: boolean;
  isClient: boolean;
  isServer: boolean;
  nodeEnv: string;
}

// Category-specific logger interface
export interface CategoryLogger {
  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
}

// Specialized logger interfaces
export interface AuthLogger extends CategoryLogger {
  stateChange(event: string, data: { hasSession: boolean; userEmail?: string }, context?: LogContext): void;
}

export interface ApiLogger extends CategoryLogger {
  request(method: string, url: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  success(method: string, url: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  // Override the error method with API-specific signature
  error(message: string, error?: Error, context?: LogContext): void;
  // Add API-specific error method
  requestError(method: string, url: string, error: Error, context?: LogContext): void;
}

export interface CacheLogger extends CategoryLogger {
  hit(key: string, context?: LogContext): void;
  miss(key: string, context?: LogContext): void;
  invalidate(type: string, source: string, context?: LogContext): void;
  clear(cacheType: string, context?: LogContext): void;
}

export interface StoreLogger extends CategoryLogger {
  reset(storeName: string, context?: LogContext): void;
  init(message: string, data?: { retryAttempt?: number; maxRetries?: number }, context?: LogContext): void;
}

export interface TournamentLogger extends CategoryLogger {
  transition(message: string, tournamentData?: { name?: string; round?: number }, context?: LogContext): void;
}

export interface MiddlewareLogger extends CategoryLogger {
  redirect(from: string, to: string, reason?: string, context?: LogContext): void;
}

// Main logger interface
export interface ILogger {
  // Category-specific loggers
  auth: AuthLogger;
  api: ApiLogger;
  cache: CacheLogger;
  store: StoreLogger;
  tournament: TournamentLogger;
  middleware: MiddlewareLogger;
  system: CategoryLogger;
  
  // General methods
  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  
  // Utility methods
  flush(): Promise<void>;
  close(): Promise<void>;
}
