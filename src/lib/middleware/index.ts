/**
 * Middleware System Index
 * 
 * Main entry point for the organized middleware system
 */

// Core exports
export { middlewareManager, createMiddleware, MiddlewareManager } from './core/manager';
export type { 
  MiddlewareFunction, 
  MiddlewareContext, 
  MiddlewareConfig,
  AuthData,
  SecurityData,
  RateLimitData,
  AnalyticsData
} from './core/types';

// Handler exports
export {
  authMiddleware,
  securityMiddleware,
  rateLimitMiddleware,
  analyticsMiddleware,
  responseEnhancementMiddleware
} from './handlers';

// Configuration exports
export { registerMiddlewares, middlewareConfig, getMiddlewareConfig } from './config';

// Utility exports
export { middlewareDebugger } from './utils/debug';

// Development utilities (only available in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Middleware Debug Mode Enabled');
}
