import { NextResponse, type NextRequest } from "next/server";
import { log } from '@/src/lib/logging';

/**
 * Centralized Middleware System
 * 
 * This system allows you to register multiple middleware functions and execute them
 * in a controlled order with comprehensive logging and error handling.
 */

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

class CentralizedMiddleware {
  private middlewares: MiddlewareConfig[] = [];
  private debugMode = process.env.NODE_ENV === 'development';

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

    if (this.debugMode) {
      log.middleware.info(`Registered middleware: ${middleware.name}`, {
        priority: middleware.priority,
        enabled: middleware.enabled,
        totalMiddlewares: this.middlewares.length
      });
    }
  }

  /**
   * Enable or disable a specific middleware
   */
  setEnabled(name: string, enabled: boolean) {
    const middleware = this.middlewares.find(m => m.name === name);
    if (middleware) {
      middleware.enabled = enabled;
      if (this.debugMode) {
        log.middleware.info(`Middleware ${name} ${enabled ? 'enabled' : 'disabled'}`);
      }
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

    if (this.debugMode) {
      log.middleware.info("🚀 Centralized middleware execution started", {
        pathname,
        totalMiddlewares: this.middlewares.length,
        enabledMiddlewares: enabledMiddlewares.length,
        middlewares: enabledMiddlewares.map(m => m.name)
      });
    }

    let response: NextResponse | null = null;

    try {
      for (let i = 0; i < enabledMiddlewares.length; i++) {
        const middleware = enabledMiddlewares[i]!;
        context.execution.currentIndex = i;

        if (context.skip) {
          if (this.debugMode) {
            log.middleware.info(`⏭️ Skipping middleware: ${middleware.name}`);
          }
          continue;
        }

        const middlewareStart = Date.now();
        
        if (this.debugMode) {
          log.middleware.info(`▶️ Executing middleware: ${middleware.name}`, {
            priority: middleware.priority,
            index: i + 1,
            total: enabledMiddlewares.length
          });
        }

        try {
          response = await middleware.function(request, context);
          
          const middlewareTime = Date.now() - middlewareStart;
          
          if (this.debugMode) {
            log.middleware.info(`✅ Middleware completed: ${middleware.name}`, {
              executionTime: `${middlewareTime}ms`,
              hasResponse: !!response,
              contextData: Object.keys(context.data)
            });
          }

          // If middleware returns a response, stop execution
          if (response) {
            if (this.debugMode) {
              log.middleware.info(`🔄 Middleware ${middleware.name} returned response, stopping execution`);
            }
            break;
          }

        } catch (error) {
          const middlewareTime = Date.now() - middlewareStart;
          
          log.middleware.error(`❌ Middleware error: ${middleware.name}`, 
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
      
      if (this.debugMode) {
        log.middleware.info("🏁 Centralized middleware execution completed", {
          pathname,
          totalExecutionTime: `${totalTime}ms`,
          executedMiddlewares: enabledMiddlewares.slice(0, context.execution.currentIndex + 1).map(m => m.name),
          skippedMiddlewares: context.skip ? enabledMiddlewares.slice(context.execution.currentIndex + 1).map(m => m.name) : [],
          finalResponse: response?.status || 'next'
        });
      }

      // Add debug headers in development
      if (this.debugMode) {
        response.headers.set('x-middleware-count', enabledMiddlewares.length.toString());
        response.headers.set('x-middleware-time', `${totalTime}ms`);
        response.headers.set('x-middleware-executed', enabledMiddlewares.slice(0, context.execution.currentIndex + 1).map(m => m.name).join(','));
      }

      return response;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      log.middleware.error("💥 Critical middleware error", 
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
export const middlewareManager = new CentralizedMiddleware();

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

// Export for debugging purposes
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).middlewareManager = middlewareManager;
}
