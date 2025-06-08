/**
 * Middleware Configuration
 * 
 * Central configuration for registering and managing middlewares
 */

import { createMiddleware } from './core/manager';
import {
  authMiddleware,
  securityMiddleware,
  rateLimitMiddleware,
  analyticsMiddleware,
  responseEnhancementMiddleware
} from './handlers';

/**
 * Middleware configuration with priorities
 * Lower priority numbers execute first
 */
export const middlewareConfig = [
  { name: 'security', priority: 10, handler: securityMiddleware },
  { name: 'auth', priority: 20, handler: authMiddleware },
  { name: 'rateLimit', priority: 30, handler: rateLimitMiddleware },
  { name: 'analytics', priority: 40, handler: analyticsMiddleware },
  { name: 'responseEnhancement', priority: 50, handler: responseEnhancementMiddleware },
] as const;

/**
 * Register all middlewares with the manager
 */
export function registerMiddlewares(): void {
  middlewareConfig.forEach(({ name, priority, handler }) => {
    createMiddleware(name, priority, handler);
  });
}

/**
 * Get middleware configuration for debugging/inspection
 */
export function getMiddlewareConfig() {
  return middlewareConfig.map(({ name, priority }) => ({
    name,
    priority
  }));
}
