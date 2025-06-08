/**
 * Analytics Middleware
 * 
 * Tracks page views and user interactions
 */

import { type NextRequest } from "next/server";
import { type MiddlewareFunction, type MiddlewareContext, type AnalyticsData, type AuthData } from "../core/types";

export const analyticsMiddleware: MiddlewareFunction = async (
  request: NextRequest,
  context: MiddlewareContext
): Promise<null> => {
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent');
  const referer = request.headers.get('referer');
  
  // Skip tracking for static assets and API routes
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || 
      pathname.includes('.')) {
    return null;
  }
  
  const authData = context.data.auth as AuthData | undefined;
    // Only log significant page views, not every static resource request
  if (authData?.isAuthenticated || pathname === '/' || pathname.startsWith('/tournament')) {
    console.log("Page view tracked", {
      pathname,
      isAuthenticated: authData?.isAuthenticated ?? false,
      hasReferer: !!referer,
      userAgent: userAgent?.slice(0, 50)
    });
  }
  
  const analyticsData: AnalyticsData = {
    tracked: true,
    pathname,
    timestamp: Date.now()
  };
  
  context.data.analytics = analyticsData;
  
  return null; // Continue to next middleware
};
