/**
 * Logging Configuration & Environment Detection
 * 
 * Centralized configuration for the self-contained Axiom logging system.
 * Handles environment detection, validation, and default settings.
 */

import type { AxiomConfig, LoggingEnvironment } from './types';
import { LogLevel, LOG_LEVEL_PRIORITY } from './types';

/**
 * Detect the current environment context
 */
export function detectEnvironment(): LoggingEnvironment {
  const isClient = typeof window !== 'undefined';
  const isServer = !isClient;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isClient,
    isServer,
    nodeEnv,
  };
}

/**
 * Get default Axiom configuration based on environment
 */
export function getDefaultAxiomConfig(): AxiomConfig {
  const env = detectEnvironment();
  
  return {
    dataset: process.env.AXIOM_DATASET ?? 'pgc-tour-logs',
    token: process.env.AXIOM_TOKEN ?? '',
    orgId: process.env.AXIOM_ORG_ID ?? '',
    baseUrl: process.env.AXIOM_BASE_URL ?? 'https://api.axiom.co',
    batchSize: parseInt(process.env.AXIOM_BATCH_SIZE ?? '100', 10),
    flushInterval: parseInt(process.env.AXIOM_FLUSH_INTERVAL ?? '5000', 10),
    retryAttempts: parseInt(process.env.AXIOM_RETRY_ATTEMPTS ?? '3', 10),
    maxBatchAge: parseInt(process.env.AXIOM_MAX_BATCH_AGE ?? '30000', 10),
    enableConsole: env.isDevelopment || process.env.AXIOM_ENABLE_CONSOLE === 'true',
    minLogLevel: (process.env.AXIOM_MIN_LOG_LEVEL as LogLevel) ?? LogLevel.DEBUG,
  };
}

/**
 * Validate Axiom configuration
 */
export function validateAxiomConfig(config: AxiomConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.dataset) {
    errors.push('Dataset is required');
  }
  
  if (config.batchSize && (config.batchSize < 1 || config.batchSize > 1000)) {
    errors.push('Batch size must be between 1 and 1000');
  }
  
  if (config.flushInterval && config.flushInterval < 1000) {
    errors.push('Flush interval must be at least 1000ms');
  }
  
  if (config.retryAttempts && (config.retryAttempts < 0 || config.retryAttempts > 10)) {
    errors.push('Retry attempts must be between 0 and 10');
  }
  
  if (config.minLogLevel && !Object.values(LogLevel).includes(config.minLogLevel)) {
    errors.push('Invalid minimum log level');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a standardized context for all logs
 */
export function createBaseContext() {
  const env = detectEnvironment();
  const version = process.env.APP_VERSION ?? process.env.npm_package_version ?? '1.0.0';
  
  return {
    environment: env.nodeEnv as 'development' | 'staging' | 'production',
    version,
    timestamp: new Date().toISOString(),
  };
}
