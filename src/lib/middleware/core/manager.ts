/**
 * Middleware Manager
 * 
 * Core middleware management system that handles registration, execution,
 * and lifecycle of middleware functions.
 */

import { NextResponse, type NextRequest } from "next/server";

export type MiddlewareFunction = (
  request: NextRequest,
  context: MiddlewareContext
) => Promise<NextResponse | null>;

export interface MiddlewareContext {
  /** Skip remaining middleware functions */
  skip: boolean;
  /** Data shared between middleware functions */
  data: Record<string, unknown>;
  /** Execution metadata */
  execution: {
    startTime: number;
    middlewareCount: number;
    currentIndex: number;
  };
}

interface MiddlewareConfig {
  name: string;
  priority: number; // Lower numbers execute first
  enabled: boolean;
  function: MiddlewareFunction;
}

export class MiddlewareManager {
  private middlewares: MiddlewareConfig[] = [];
  private debugMode = process.env.NODE_ENV === 'development';
  private verboseLogging = process.env.MIDDLEWARE_VERBOSE_LOGGING === 'true';

  /**
   * Register a middleware function
   */
  register(config: Omit<MiddlewareConfig, 'enabled'> & { enabled?: boolean }) {
    const middleware: MiddlewareConfig = {
      enabled: true,
      ...config,
    };
    
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Enable or disable a specific middleware
   */
  setEnabled(name: string, enabled: boolean) {
    const middleware = this.middlewares.find(m => m.name === name);
    if (middleware) {
      middleware.enabled = enabled;
    }
  }

  /**
   * Get list of registered middlewares with their status
   */
  getStatus() {
    return this.middlewares.map(m => ({
      name: m.name,
      priority: m.priority,
      enabled: m.enabled
    }));
  }

  /**
   * Execute all registered middleware functions
   */
  async execute(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const pathname = request.nextUrl.pathname;
    const enabledMiddlewares = this.middlewares.filter(m => m.enabled);

    const context: MiddlewareContext = {
      skip: false,
      data: {},
      execution: {
        startTime,
        middlewareCount: enabledMiddlewares.length,
        currentIndex: 0
      }
    };

    // Only log for non-static resources and if verbose logging is enabled
    const shouldLog = this.debugMode && this.verboseLogging && 
                     !pathname.includes('.') && !pathname.startsWith('/_next/');    if (shouldLog) {
      console.log("🚀 Middleware execution started", {
        pathname,
        enabledMiddlewares: enabledMiddlewares.length,
        middlewares: enabledMiddlewares.map(m => m.name)
      });
    }

    let response: NextResponse | null = null;

    try {
      for (let i = 0; i < enabledMiddlewares.length; i++) {
        const middleware = enabledMiddlewares[i]!;
        context.execution.currentIndex = i;        if (context.skip) {
          if (shouldLog) {
            console.log(`⏭️ Skipping: ${middleware.name}`);
          }
          continue;
        }

        const middlewareStart = Date.now();
        
        try {
          response = await middleware.function(request, context);
          const middlewareTime = Date.now() - middlewareStart;          
          if (shouldLog) {
            console.log(`✅ ${middleware.name} completed`, {
              executionTime: `${middlewareTime}ms`,
              hasResponse: !!response
            });
          }

          // If middleware returns a response, stop execution
          if (response) {
            if (shouldLog) {
              console.log(`🔄 ${middleware.name} returned response, stopping execution`);
            }
            break;
          }

        } catch (error) {
          const middlewareTime = Date.now() - middlewareStart;
          
          console.error(`❌ ${middleware.name} error`, 
            error instanceof Error ? error : new Error(String(error)), 
            {
              executionTime: `${middlewareTime}ms`,
              middlewareName: middleware.name
            }
          );

          // Continue with next middleware unless it's a critical error
          if (error instanceof Error && error.message.includes('CRITICAL')) {
            throw error;
          }
        }
      }

      // If no middleware returned a response, return default
      if (!response) {
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
      }

      const totalTime = Date.now() - startTime;      
      if (shouldLog) {
        console.log("🏁 Middleware execution completed", {
          pathname,
          totalExecutionTime: `${totalTime}ms`,
          executedMiddlewares: enabledMiddlewares.slice(0, context.execution.currentIndex + 1).map(m => m.name)
        });
      }

      // Add debug headers in development
      if (this.debugMode) {
        response.headers.set('x-middleware-count', enabledMiddlewares.length.toString());
        response.headers.set('x-middleware-time', `${totalTime}ms`);
        response.headers.set('x-middleware-executed', enabledMiddlewares.slice(0, context.execution.currentIndex + 1).map(m => m.name).join(','));
      }

      return response;    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      console.error("💥 Critical middleware error", 
        error instanceof Error ? error : new Error(String(error)),
        {
          totalExecutionTime: `${totalTime}ms`,
          pathname
        }
      );

      // Return a fallback response
      return NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
    }
  }
}

// Global middleware manager instance
export const middlewareManager = new MiddlewareManager();

// Helper function to create middleware functions
export function createMiddleware(
  name: string,
  priority: number,
  fn: MiddlewareFunction
): void {
  middlewareManager.register({
    name,
    priority,
    function: fn
  });
}
