/**
 * Response Enhancement Middleware
 * 
 * Applies final modifications to the response
 */

import { type NextRequest, NextResponse } from "next/server";
import { type MiddlewareFunction, type MiddlewareContext, type SecurityData } from "../core/types";

export const responseEnhancementMiddleware: MiddlewareFunction = async (
  request: NextRequest,
  context: MiddlewareContext
): Promise<NextResponse> => {
  // Create the final response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  // Apply security headers if security middleware ran
  const securityData = context.data.security as SecurityData | undefined;
  if (securityData?.headersApplied) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  
  // Add middleware execution metadata in development
  if (process.env.NODE_ENV === 'development') {
    const executedMiddlewares = Object.keys(context.data);
    response.headers.set('x-middleware-data', executedMiddlewares.join(','));
    response.headers.set('x-execution-time', `${Date.now() - context.execution.startTime}ms`);
  }
  
  return response;
};
