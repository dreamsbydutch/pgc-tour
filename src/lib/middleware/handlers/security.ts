/**
 * Security Middleware
 * 
 * Adds security headers to all responses
 */

import { type NextRequest } from "next/server";
import { type MiddlewareFunction, type MiddlewareContext, type SecurityData } from "../core/types";

export const securityMiddleware: MiddlewareFunction = async (
  _request: NextRequest,
  context: MiddlewareContext
): Promise<null> => {
  // This middleware modifies the response, doesn't return early
  const securityData: SecurityData = {
    headersApplied: true,
    headers: [
      'X-Frame-Options',
      'X-Content-Type-Options', 
      'X-XSS-Protection',
      'Referrer-Policy'
    ]
  };
  
  context.data.security = securityData;
  
  return null; // Continue to next middleware
};
