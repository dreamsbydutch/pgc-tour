/**
 * Self-Contained Axiom Logging System
 * 
 * A comprehensive logging system that provides:
 * - Category-specific logging methods
 * - Structured logging with context
 * - Axiom integration for production monitoring
 * - Console logging with emoji prefixes
 * - Performance measurement capabilities
 * - Environment-aware behavior
 */

import { 
  LogLevel, 
  LogCategory
} from './types';
import type { 
  LogEntry, 
  LogContext, 
  LogError,
  ILogger,
  AuthLogger,
  ApiLogger,
  CacheLogger,
  StoreLogger,
  TournamentLogger,
  MiddlewareLogger,
  CategoryLogger
} from './types';
import { AxiomLogger } from './axiom-logger';
import { createBaseContext } from './config';

class Logger implements ILogger {
  private axiomLogger: AxiomLogger;
  private baseContext: LogContext;

  constructor() {
    this.axiomLogger = new AxiomLogger();
    this.baseContext = createBaseContext();
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, unknown>
  ): LogEntry {
    const mergedContext = { ...this.baseContext, ...context };
    
    const logError: LogError | undefined = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error instanceof Error && 'code' in error 
        ? typeof (error as Error & { code: unknown }).code === 'string' || typeof (error as Error & { code: unknown }).code === 'number'
          ? (error as Error & { code: string | number }).code
          : undefined
        : undefined,
      cause: error instanceof Error && 'cause' in error ? (error as Error & { cause: unknown }).cause : undefined,
    } : undefined;

    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: mergedContext,
      error: logError,
      metadata,
      environment: this.baseContext.environment,
      version: this.baseContext.version,
    };
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, unknown>
  ): void {
    const entry = this.createLogEntry(level, category, message, context, error, metadata);
    this.axiomLogger.log(entry);
  }

  /**
   * Authentication logging
   */
  public auth: AuthLogger = {
    info: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.AUTH, message, context, undefined, metadata);
    },
    warn: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.WARN, LogCategory.AUTH, message, context, undefined, metadata);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      this.log(LogLevel.ERROR, LogCategory.AUTH, message, context, error);
    },
    debug: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.DEBUG, LogCategory.AUTH, message, context, undefined, metadata);
    },
    stateChange: (event: string, data: { hasSession: boolean; userEmail?: string }, context?: LogContext) => {
      this.log(LogLevel.INFO, LogCategory.AUTH, `Auth state change: ${event}`, context, undefined, data);
    },
  };

  /**
   * Cache logging
   */
  public cache: CacheLogger = {
    info: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.CACHE, message, context, undefined, metadata);
    },
    warn: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.WARN, LogCategory.CACHE, message, context, undefined, metadata);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      this.log(LogLevel.ERROR, LogCategory.CACHE, message, context, error);
    },
    debug: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.DEBUG, LogCategory.CACHE, message, context, undefined, metadata);
    },
    invalidate: (type: string, source: string, context?: LogContext) => {
      this.log(LogLevel.INFO, LogCategory.CACHE, `Cache invalidated`, context, undefined, { type, source });
    },
    hit: (key: string, context?: LogContext) => {
      this.log(LogLevel.DEBUG, LogCategory.CACHE, `Cache hit`, context, undefined, { key });
    },
    miss: (key: string, context?: LogContext) => {
      this.log(LogLevel.DEBUG, LogCategory.CACHE, `Cache miss`, context, undefined, { key });
    },
    clear: (cacheType: string, context?: LogContext) => {
      this.log(LogLevel.INFO, LogCategory.CACHE, `Cache clear: ${cacheType}`, context);
    },
  };

  /**
   * API logging
   */
  public api: ApiLogger = {
    info: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.API, message, context, undefined, metadata);
    },
    warn: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.WARN, LogCategory.API, message, context, undefined, metadata);
    },
    error: (method: string, url: string, error: Error, context?: LogContext) => {
      this.log(LogLevel.ERROR, LogCategory.API, `${method} ${url} failed`, context, error);
    },
    debug: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.DEBUG, LogCategory.API, message, context, undefined, metadata);
    },
    request: (method: string, url: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.API, `${method} ${url}`, context, undefined, metadata);
    },
    success: (method: string, url: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.API, `${method} ${url} success`, context, undefined, metadata);
    },
  };

  /**
   * Tournament logging
   */
  public tournament: TournamentLogger = {
    info: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.TOURNAMENT, message, context, undefined, metadata);
    },
    warn: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.WARN, LogCategory.TOURNAMENT, message, context, undefined, metadata);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      this.log(LogLevel.ERROR, LogCategory.TOURNAMENT, message, context, error);
    },
    debug: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.DEBUG, LogCategory.TOURNAMENT, message, context, undefined, metadata);
    },
    transition: (message: string, tournamentData?: { name?: string; round?: number }, context?: LogContext) => {
      this.log(LogLevel.INFO, LogCategory.TOURNAMENT, message, context, undefined, tournamentData);
    },
  };

  /**
   * Store logging
   */
  public store: StoreLogger = {
    info: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.STORE, message, context, undefined, metadata);
    },
    warn: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.WARN, LogCategory.STORE, message, context, undefined, metadata);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      this.log(LogLevel.ERROR, LogCategory.STORE, message, context, error);
    },
    debug: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.DEBUG, LogCategory.STORE, message, context, undefined, metadata);
    },
    reset: (storeName: string, context?: LogContext) => {
      this.log(LogLevel.INFO, LogCategory.STORE, `${storeName} store reset`, context);
    },
    init: (message: string, data?: { retryAttempt?: number; maxRetries?: number }, context?: LogContext) => {
      this.log(LogLevel.INFO, LogCategory.STORE, message, context, undefined, data);
    },
  };

  /**
   * Middleware logging
   */
  public middleware: MiddlewareLogger = {
    info: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.MIDDLEWARE, message, context, undefined, metadata);
    },
    warn: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.WARN, LogCategory.MIDDLEWARE, message, context, undefined, metadata);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      this.log(LogLevel.ERROR, LogCategory.MIDDLEWARE, message, context, error);
    },
    debug: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.DEBUG, LogCategory.MIDDLEWARE, message, context, undefined, metadata);
    },
    redirect: (from: string, to: string, reason?: string, context?: LogContext) => {
      this.log(LogLevel.INFO, LogCategory.MIDDLEWARE, `Redirect: ${from} -> ${to}`, context, undefined, { reason });
    },
  };

  /**
   * System logging
   */
  public system: CategoryLogger = {
    info: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.INFO, LogCategory.SYSTEM, message, context, undefined, metadata);
    },
    warn: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.WARN, LogCategory.SYSTEM, message, context, undefined, metadata);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      this.log(LogLevel.ERROR, LogCategory.SYSTEM, message, context, error);
    },
    debug: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
      this.log(LogLevel.DEBUG, LogCategory.SYSTEM, message, context, undefined, metadata);
    },
  };

  /**
   * General logging methods
   */
  public info = (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
    this.log(LogLevel.INFO, LogCategory.GENERAL, message, context, undefined, metadata);
  };

  public warn = (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
    this.log(LogLevel.WARN, LogCategory.GENERAL, message, context, undefined, metadata);
  };

  public error = (message: string, error?: Error, context?: LogContext) => {
    this.log(LogLevel.ERROR, LogCategory.GENERAL, message, context, error);
  };

  public debug = (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
    this.log(LogLevel.DEBUG, LogCategory.GENERAL, message, context, undefined, metadata);
  };

  /**
   * Utility methods
   */
  public async flush(): Promise<void> {
    await this.axiomLogger.flush();
  }

  public async close(): Promise<void> {
    await this.axiomLogger.close();
  }

  /**
   * Get logger configuration and status
   */
  public getConfig() {
    return this.axiomLogger.getConfig();
  }

  public getBatchSize(): number {
    return this.axiomLogger.getBatchSize();
  }
}

// Create singleton instance
export const logger = new Logger();
export default logger;
