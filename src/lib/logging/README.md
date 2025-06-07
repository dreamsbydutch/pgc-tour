# 🚀 Self-Contained Axiom Logging System

A comprehensive, production-ready logging solution for the PGC Tour application with structured logging, Axiom integration, and category-specific methods.

## 📁 Directory Structure

```
logging/
├── README.md           # This comprehensive documentation
├── index.ts            # Main exports and public API
├── types.ts            # TypeScript type definitions
├── config.ts           # Configuration and environment detection
├── axiom-logger.ts     # Core Axiom integration and batching
├── logger.ts           # Main logger implementation with categories
└── utils.ts            # Performance monitoring and dev utilities
```

## 🎯 Key Features

- **🎯 Category-Specific Logging**: Organized by functional areas (auth, API, cache, etc.)
- **📊 Structured Logging**: Consistent JSON format with context and metadata
- **⚡ Axiom Integration**: Production logs automatically sent to Axiom for monitoring
- **🔧 Performance Tracking**: Built-in performance measurement utilities
- **🐛 Development Tools**: Enhanced dev-only logging with tables, groups, assertions
- **🌍 Environment Aware**: Automatic detection of client/server, dev/prod environments
- **🔄 Intelligent Batching**: Efficient log batching with automatic flushing
- **🛡️ Error Handling**: Robust retry logic and graceful degradation
- **🔒 Type Safe**: Full TypeScript support with proper interfaces
- **📦 Zero Dependencies**: Everything self-contained in this folder

## 🚀 Quick Start

### Basic Usage

```typescript
import { log } from '@/src/lib/logging';

// Category-specific logging
log.auth.info('User signed in', { userId: '123' });
log.api.request('GET', '/api/tournaments');
log.cache.invalidate('tournaments', 'user-action');
log.tournament.transition('Tournament started', { name: 'Masters 2025' });
```

### Performance Monitoring

```typescript
import { perf } from '@/src/lib/logging';

// Simple timer
const timer = perf.start('Database query');
// ... do work
timer(); // Automatically logs duration

// Async operations
const result = await perf.measure('API call', async () => {
  return await fetch('/api/data');
});
```

### Development Utilities

```typescript
import { dev } from '@/src/lib/logging';

// Only shows in development
dev.log('Debug info', { state: 'testing' });
dev.table(dataArray, 'User Data');
dev.assert(condition, 'Should be truthy');
```

## 📚 Complete API Reference

### Logger Categories

Each category provides `info`, `warn`, `error`, and `debug` methods:

#### Authentication (`log.auth`)
```typescript
log.auth.info('User authenticated', context, metadata);
log.auth.error('Login failed', error, context);
log.auth.stateChange('Session created', { hasSession: true, userEmail: 'user@example.com' }, context);
```

#### API Calls (`log.api`)
```typescript
log.api.request('GET', '/api/endpoint', context, metadata);
log.api.success('POST', '/api/endpoint', context, metadata);
log.api.error('PUT', '/api/endpoint', error, context);
```

#### Cache Operations (`log.cache`)
```typescript
log.cache.hit('cache-key', context);
log.cache.miss('cache-key', context);
log.cache.invalidate('cache-type', 'source', context);
log.cache.clear('cache-type', context);
```

#### Store Management (`log.store`)
```typescript
log.store.info('Store updated', context, metadata);
log.store.reset('store-name', context);
log.store.init('Initializing...', { retryAttempt: 1, maxRetries: 3 }, context);
log.store.error('Store error', error, context);
```

#### Tournament Events (`log.tournament`)
```typescript
log.tournament.info('Tournament info', context, metadata);
log.tournament.transition('Status changed', { name: 'Tournament Name', round: 1 }, context);
log.tournament.error('Tournament error', error, context);
```

#### Middleware (`log.middleware`)
```typescript
log.middleware.info('Middleware info', context, metadata);
log.middleware.redirect('/from', '/to', 'reason', context);
log.middleware.error('Middleware error', error, context);
```

#### System Events (`log.system`)
```typescript
log.system.info('System info', context, metadata);
log.system.debug('Debug info', context, metadata);
log.system.error('System error', error, context);
```

### General Methods

```typescript
log.info('General info', context, metadata);
log.warn('Warning message', context, metadata);
log.error('Error occurred', error, context);
log.debug('Debug info', context, metadata);
```

### Performance Utilities (`perf`)

```typescript
// Start/stop timer
const timer = perf.start('operation-name');
// ... do work
timer(); // Logs duration automatically

// Measure async operations
const result = await perf.measure('async-operation', async () => {
  return await someAsyncWork();
}, LogCategory.API, context);

// Performance marks for complex workflows
perf.mark('workflow-start');
// ... do work
perf.measureBetween('phase-1', 'workflow-start', 'workflow-end', context);
```

### Development Utilities (`dev`)

```typescript
// Development-only logging (automatically filtered in production)
dev.log('Debug message', data, context);
dev.warn('Dev warning', data, context);
dev.error('Dev error', error, context);

// Console table (browser only)
dev.table(arrayData, 'Table Title');

// Development assertions
dev.assert(condition, 'Assertion message', context);

// Development timing
const devTimer = dev.time('operation');
// ... do work
devTimer(); // Logs to console and structured logs

// Grouped logging
const endGroup = dev.group('Authentication Flow');
dev.log('Step 1: Started');
dev.log('Step 2: Validated');
endGroup();
```

## 🔧 Configuration

### Environment Variables

```bash
# Required for Axiom integration
AXIOM_TOKEN=your_axiom_token
AXIOM_DATASET=pgc-tour-logs

# Optional configuration
AXIOM_ORG_ID=your_org_id
AXIOM_BATCH_SIZE=100
AXIOM_FLUSH_INTERVAL=5000
AXIOM_RETRY_ATTEMPTS=3
AXIOM_MAX_BATCH_AGE=30000
NODE_ENV=development|production
```

### Advanced Configuration

```typescript
import { AxiomLogger } from '@/src/lib/logging';

// Custom Axiom logger with specific config
const customLogger = new AxiomLogger({
  dataset: 'custom-logs',
  batchSize: 50,
  flushInterval: 3000,
  retryAttempts: 5,
  enableConsole: true,
  minLogLevel: LogLevel.INFO
});
```

## 📊 Log Structure

All logs follow a consistent structure optimized for Axiom queries:

```typescript
{
  timestamp: "2025-01-21T10:30:00.000Z",
  level: "info",
  category: "auth", 
  message: "User signed in",
  context: {
    userId: "123",
    sessionId: "sess_abc",
    requestId: "req_xyz",
    environment: "production",
    version: "1.0.0"
  },
  metadata: {
    // Additional structured data
  },
  error: {
    name: "Error",
    message: "Error description",
    stack: "...",
    code: "ERR_CODE"
  }
}
```

## 🏗️ Architecture & Data Flow

```
Application Code
       ↓
Category Logger (auth, api, etc.)
       ↓
Main Logger (logger.ts)
       ↓
AxiomLogger (batching)
       ↓
Console (always) + Axiom (production)
```

### Environment Handling

- **Development**: Console logging with emojis, detailed debug info, dev utilities enabled
- **Production**: Structured logs to Axiom, minimal console logging
- **Client**: Console logging only (Axiom disabled for security)
- **Server**: Full Axiom integration with batching and retries

## 🚀 Best Practices

### Context Usage
Always include relevant context for better log searchability:

```typescript
const context = {
  userId: '123',
  sessionId: 'sess_abc',
  requestId: 'req_xyz'
};
log.auth.info('Authentication successful', context);
```

### Error Handling
Include as much context as possible with errors:

```typescript
try {
  await riskyOperation();
} catch (error) {
  log.api.error('Operation failed', error as Error, {
    userId: user.id,
    operation: 'create-tournament',
    inputData: sanitizedInput
  });
}
```

### Performance Monitoring
Use performance utilities for operations that matter:

```typescript
// For critical paths
const timer = perf.start('database-query');
const result = await database.query(sql);
timer();

// For comprehensive monitoring
const result = await perf.measure('user-registration', async () => {
  return await registerUser(userData);
}, LogCategory.AUTH, context);
```

### Development Debugging
Leverage dev utilities during development:

```typescript
dev.log('Component state', componentState);
dev.table(userData, 'User Registration Data');
dev.assert(userData.email, 'Email should be provided');
```

## 🔍 Monitoring & Queries

### Common Axiom Queries

```kusto
// Find all authentication errors in the last hour
['pgc-tour-logs']
| where _time > ago(1h)
| where category == "auth" and level == "error"
| project _time, message, context, error

// Monitor API performance
['pgc-tour-logs']
| where category == "system" and message contains "Performance"
| extend duration = todouble(metadata.durationMs)
| summarize avg(duration), max(duration), count() by bin(_time, 5m)

// Track user sessions
['pgc-tour-logs']
| where context.sessionId != ""
| project _time, level, category, message, context.sessionId, context.userId
| order by _time desc

// Error tracking with stack traces
['pgc-tour-logs'] 
| where level == "error" 
| project _time, category, message, error.name, error.stack
```

### Console Output (Development)
```
🔐 ℹ️ [AUTH] User signed in { userId: '123', sessionId: 'abc' }
🌐 📤 [API] GET /api/tournaments { responseTime: 245 }
💾 ❌ [CACHE] Cache miss { key: 'tournaments:active' }
⚙️ 🐛 [SYSTEM] Performance: Database query completed in 23.45ms
```

## 🛠️ Server API Route

Client-side code can send logs to the server via:

```
POST /api/logging
```

**Request Format:**
```json
{
  "logs": [
    {
      "level": "INFO",
      "context": "AUTH",
      "message": "Client-side authentication",
      "data": { "userId": "123" },
      "userId": "123",
      "sessionId": "sess_abc"
    }
  ]
}
```

This enables proper Axiom integration for browser-based logs.

## 📈 Migration Guide

### From Console.log

```typescript
// Old way
console.log('🔐 User signed in:', { userId: '123' });
console.error('❌ API error:', error);
console.warn('Cache miss');

// New way
log.auth.info('User signed in', { userId: '123' });
log.api.error('API request failed', error, { endpoint: '/api/data' });
log.cache.miss('data:123');
```

### From Other Logging Libraries

```typescript
// Winston/Pino style
logger.info('User authenticated', { userId: '123' });

// Our system (with context and category)
log.auth.info('User authenticated', { userId: '123' });
```

## 🛠️ Troubleshooting

### Common Issues

1. **Logs not appearing in Axiom**
   - Check `AXIOM_TOKEN` environment variable
   - Verify `AXIOM_DATASET` is correct
   - Ensure you're in server environment (not client)

2. **Console logs not showing**
   - Check if `enableConsole` is set to `true` in config
   - Verify you're in development mode for dev utilities

3. **Performance impact**
   - Logs are batched automatically
   - Console logging can be disabled in production
   - Use appropriate log levels to filter noise

### Debug Mode

```typescript
import { logger } from '@/src/lib/logging';

// Check configuration
console.log(logger.getConfig());

// Force flush logs
await logger.flush();

// Check batch size
console.log(logger.getBatchSize());
```

## 🎯 Production Deployment

### Required Environment Variables
```bash
AXIOM_TOKEN=your_production_token
AXIOM_DATASET=pgc-tour-logs
NODE_ENV=production
```

### Optional Tuning
```bash
AXIOM_BATCH_SIZE=100          # Logs per batch
AXIOM_FLUSH_INTERVAL=5000     # Flush every 5 seconds
AXIOM_RETRY_ATTEMPTS=3        # Retry failed requests
AXIOM_MAX_BATCH_AGE=30000     # Force flush after 30 seconds
```

## ✨ Benefits Summary

1. **Self-Contained**: No external logging dependencies
2. **Production Ready**: Battle-tested Axiom integration  
3. **Developer Friendly**: Rich development experience
4. **Type Safe**: Full TypeScript support prevents errors
5. **Scalable**: Handles high-volume logging efficiently
6. **Maintainable**: Clear structure and comprehensive docs
7. **Flexible**: Easy to extend with new categories
8. **Reliable**: Robust error handling and retry logic
9. **Observable**: Rich monitoring and querying capabilities
10. **Efficient**: Intelligent batching and minimal overhead

---

**Ready for Production**: This logging system is a complete, self-contained Axiom logging machine ready for production deployment with comprehensive monitoring, debugging, and performance tracking capabilities.
