/**
 * Enhanced Axiom Logger Implementation
 * 
 * Self-contained Axiom logging client with robust error handling,
 * intelligent batching, and environment-aware configuration.
 */

import type { LogEntry, AxiomConfig } from './types';
import { LogLevel } from './types';
import { validateAxiomConfig, detectEnvironment } from './config';

// Local shouldLog implementation (if not provided elsewhere)
function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return level >= minLevel;
}

// Configuration merging function
function mergeConfig(userConfig: Partial<AxiomConfig>): AxiomConfig {
  // Get defaults from environment variables
  const defaults: AxiomConfig = {
    token: process.env.AXIOM_TOKEN ?? '',
    baseUrl: process.env.AXIOM_BASE_URL ?? 'https://api.axiom.co',
    dataset: process.env.AXIOM_DATASET ?? 'pgc-tour-logs',
    enableConsole: process.env.NODE_ENV === 'development' || process.env.AXIOM_ENABLE_CONSOLE === 'true',
    minLogLevel: (process.env.AXIOM_MIN_LOG_LEVEL as LogLevel) ?? LogLevel.DEBUG,
    batchSize: parseInt(process.env.AXIOM_BATCH_SIZE ?? '100', 10),
    flushInterval: parseInt(process.env.AXIOM_FLUSH_INTERVAL ?? '5000', 10),
    maxBatchAge: parseInt(process.env.AXIOM_MAX_BATCH_AGE ?? '30000', 10),
    retryAttempts: parseInt(process.env.AXIOM_RETRY_ATTEMPTS ?? '3', 10),
  };

  return {
    ...defaults,
    ...userConfig,
    // Ensure required fields are not undefined if userConfig provides them as undefined
    token: userConfig.token ?? defaults.token,
    baseUrl: userConfig.baseUrl ?? defaults.baseUrl,
    dataset: userConfig.dataset ?? defaults.dataset,
    enableConsole: userConfig.enableConsole ?? defaults.enableConsole,
    minLogLevel: userConfig.minLogLevel ?? defaults.minLogLevel,
    batchSize: userConfig.batchSize ?? defaults.batchSize,
    flushInterval: userConfig.flushInterval ?? defaults.flushInterval,
    maxBatchAge: userConfig.maxBatchAge ?? defaults.maxBatchAge,
    retryAttempts: userConfig.retryAttempts ?? defaults.retryAttempts,
  };
}

// Define emojis locally since they're not exported from types
const LEVEL_EMOJIS = {
  [LogLevel.DEBUG]: '🐛',
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '❌',
} as const;

const CATEGORY_EMOJIS = {
  'AUTH': '🔐',
  'TOURNAMENT': '🏆',
  'API': '🌐',
  'STORE': '📦',
  'GENERAL': 'ℹ️',
  'MIDDLEWARE': '🔀',
  'DATABASE': '🗄️',
  'CACHE': '💾',
  'SYSTEM': '⚙️',
} as const;

export class AxiomLogger {
  private config: AxiomConfig;
  private batch: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private batchStartTime: number = Date.now();
  private isClosing = false;
  private environment = detectEnvironment();

  constructor(userConfig: Partial<AxiomConfig> = {}) {
    this.config = mergeConfig(userConfig);
    
    // Validate configuration
    const validation = validateAxiomConfig(this.config);
    if (!validation.valid) {
      const errorMsg = `Invalid Axiom configuration: ${validation.errors.join(', ')}`;
      if (this.config.enableConsole) {
        console.error('❌ [LOGGING]', errorMsg);
      }
      throw new Error(errorMsg);
    }

    this.startFlushTimer();
    this.setupShutdownHandlers();
  }

  private startFlushTimer(): void {
    if (this.environment.isServer && !this.isClosing) {
      this.flushTimer = setInterval(() => {
        void this.flushIfNeeded();
      }, this.config.flushInterval);
    }
  }

  private setupShutdownHandlers(): void {
    if (this.environment.isServer && typeof process !== 'undefined' && process.on) {
      // Handle graceful shutdown
      const gracefulShutdown = () => {
        this.close().catch(console.error);
      };

      try {
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        process.on('beforeExit', gracefulShutdown);
      } catch (error) {
        // Ignore errors in environments where process events aren't supported
        if (this.config.enableConsole) {
          console.warn('⚠️ [LOGGING] Process event handlers not supported in this environment');
        }
      }
    }
  }

  private async flushIfNeeded(): Promise<void> {
    if (this.batch.length === 0) return;
    
    const shouldFlushBySize = this.batch.length >= (this.config.batchSize ?? 100);
    const shouldFlushByAge = Date.now() - this.batchStartTime > (this.config.maxBatchAge ?? 30000);
    
    if (shouldFlushBySize || shouldFlushByAge) {
      await this.flush();
    }
  }

  private async sendToAxiom(entries: LogEntry[], attempt = 1): Promise<void> {
    if (!this.config.token) {
      if (this.config.enableConsole) {
        console.warn('⚠️ [LOGGING] Axiom token not configured, logs will only appear in console');
      }
      return;
    }

    try {
      const url = `${this.config.baseUrl}/v1/datasets/${this.config.dataset}/ingest`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'pgc-tour-logging/1.0',
          'X-Axiom-Source': 'pgc-tour-app',
        },
        body: JSON.stringify(entries),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Axiom API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (this.config.enableConsole) {
        console.log(`📤 [LOGGING] Successfully sent ${entries.length} logs to Axiom`);
      }
    } catch (error) {
      const isLastAttempt = attempt >= this.config.retryAttempts!;
      
      if (!isLastAttempt) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10s delay
        if (this.config.enableConsole) {
          console.warn(`⚠️ [LOGGING] Axiom send failed (attempt ${attempt}), retrying in ${delay}ms:`, error);
        }
        setTimeout(() => void this.sendToAxiom(entries, attempt + 1), delay);
      } else {
        if (this.config.enableConsole) {
          console.error(`❌ [LOGGING] Failed to send logs to Axiom after ${this.config.retryAttempts ?? 3} attempts:`, error);
        }
      }
    }
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const categoryEmoji = CATEGORY_EMOJIS[entry.category as unknown as keyof typeof CATEGORY_EMOJIS] || 'ℹ️';
    const levelEmoji = LEVEL_EMOJIS[entry.level as keyof typeof LEVEL_EMOJIS] || 'ℹ️';
    const prefix = `${categoryEmoji} ${levelEmoji} [${entry.category.toUpperCase()}]`;
    
    const logData: unknown[] = [entry.message];
    if (entry.context && Object.keys(entry.context).length > 0) {
      logData.push(entry.context);
    }
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logData.push(entry.metadata);
    }
    if (entry.error) {
      logData.push(entry.error);
    }

    const consoleMethod = 
      entry.level === LogLevel.ERROR ? 'error' :
      entry.level === LogLevel.WARN ? 'warn' :
      entry.level === LogLevel.DEBUG ? 'debug' : 'log';

    console[consoleMethod](prefix, ...logData);
  }

  public log(entry: LogEntry): void {
    // Check if we should log this level
    if (!shouldLog(entry.level, this.config.minLogLevel ?? LogLevel.DEBUG)) {
      return;
    }

    // Console logging
    this.logToConsole(entry);

    // Skip Axiom logging in client environment for now
    if (this.environment.isClient) {
      return;
    }

    // Add to batch for Axiom
    this.batch.push(entry);
    
    // Update batch start time if this is the first entry
    if (this.batch.length === 1) {
      this.batchStartTime = Date.now();
    }

    // Immediate flush for error logs
    if (entry.level === LogLevel.ERROR) {
      this.flush().catch(error => {
        if (this.config.enableConsole) {
          console.error('❌ [LOGGING] Failed to flush critical log:', error);
        }
      });
    }
    // Check if we need to flush
    else if (this.batch.length >= (this.config.batchSize ?? 100)) {
      this.flush().catch(error => {
        if (this.config.enableConsole) {
          console.error('❌ [LOGGING] Failed to flush batch:', error);
        }
      });
    }
  }

  public async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const entriesToSend = [...this.batch];
    this.batch = [];
    this.batchStartTime = Date.now();

    await this.sendToAxiom(entriesToSend);
  }

  public async close(): Promise<void> {
    if (this.isClosing) return;
    
    this.isClosing = true;
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    
    await this.flush();
  }

  public getConfig(): Readonly<AxiomConfig> {
    return { ...this.config };
  }

  public getBatchSize(): number {
    return this.batch.length;
  }
}

