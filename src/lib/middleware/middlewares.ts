import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/src/lib/supabase/middleware";
import { type MiddlewareFunction, type MiddlewareContext } from "./index";
import { log } from '@/src/lib/logging';

/**
 * Authentication Middleware
 * Handles Supabase session management and authentication
 */
export const authMiddleware: MiddlewareFunction = async (
  request: NextRequest,
  context: MiddlewareContext
): Promise<NextResponse | null> => {
  try {
    // Call the existing Supabase middleware
    const response = await updateSession(request);
    
    // Extract auth information from headers for other middleware
    const authStatus = response.headers.get('x-auth-status');
    const userId = response.headers.get('x-auth-user-id');
    const userEmail = response.headers.get('x-auth-user-email');
    
    context.data.auth = {
      status: authStatus,
      userId,
      userEmail,
      isAuthenticated: authStatus === 'authenticated'
    };
    
    // If auth middleware returns a redirect, return it immediately
    if (response.status >= 300 && response.status < 400) {
      log.middleware.info("Auth middleware returning redirect", {
        status: response.status,
        location: response.headers.get('location')
      });
      return response;
    }
    
    // Otherwise continue with the response for potential modification by other middleware
    return response;
    
  } catch (error) {
    log.middleware.error("Auth middleware error", 
      error instanceof Error ? error : new Error(String(error))
    );
    // Don't block the request, continue to next middleware
    return null;
  }
};

/**
 * Security Headers Middleware
 * Adds security headers to all responses
 */
export const securityMiddleware: MiddlewareFunction = async (
  request: NextRequest,
  context: MiddlewareContext
): Promise<NextResponse | null> => {
  // This middleware modifies the response, doesn't return early
  context.data.security = {
    headersApplied: true,
    headers: [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Referrer-Policy'
    ]
  };
  
  return null; // Continue to next middleware
};

/**
 * Rate Limiting Middleware
 * Basic rate limiting for API routes
 */
export const rateLimitMiddleware: MiddlewareFunction = async (
  request: NextRequest,
  context: MiddlewareContext
): Promise<NextResponse | null> => {
  const pathname = request.nextUrl.pathname;
  
  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return null;
  }
  
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const key = `rate_limit:${ip}:${pathname}`;
  
  // In a real implementation, you'd use Redis or similar
  // For now, just log the rate limiting attempt
  log.middleware.info("Rate limiting check", {
    ip: ip.split('.').slice(0, 2).join('.') + '.xxx.xxx', // Partially mask IP
    pathname,
    key
  });
  
  context.data.rateLimit = {
    checked: true,
    ip,
    pathname
  };
  
  return null; // Continue to next middleware
};

/**
 * Analytics Middleware
 * Tracks page views and user interactions
 */
export const analyticsMiddleware: MiddlewareFunction = async (
  request: NextRequest,
  context: MiddlewareContext
): Promise<NextResponse | null> => {
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent');
  const referer = request.headers.get('referer');
  
  // Skip tracking for static assets and API routes
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || 
      pathname.includes('.')) {
    return null;
  }
  
  const authData = context.data.auth as { isAuthenticated?: boolean; userId?: string } | undefined;
  
  log.middleware.info("Page view tracked", {
    pathname,
    isAuthenticated: authData?.isAuthenticated || false,
    hasReferer: !!referer,
    userAgent: userAgent?.slice(0, 50)
  });
  
  context.data.analytics = {
    tracked: true,
    pathname,
    timestamp: Date.now()
  };
  
  return null; // Continue to next middleware
};

/**
 * Response Enhancement Middleware
 * Applies final modifications to the response
 */
export const responseEnhancementMiddleware: MiddlewareFunction = async (
  request: NextRequest,
  context: MiddlewareContext
): Promise<NextResponse | null> => {
  // Create the final response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  // Apply security headers if security middleware ran
  if (context.data.security?.headersApplied) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  
  // Add middleware execution metadata
  if (process.env.NODE_ENV === 'development') {
    const executedMiddlewares = Object.keys(context.data);
    response.headers.set('x-middleware-data', executedMiddlewares.join(','));
    response.headers.set('x-execution-time', `${Date.now() - context.execution.startTime}ms`);
  }
  
  return response;
};
