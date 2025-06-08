/**
 * Authentication Middleware
 * 
 * Handles Supabase session management and authentication
 */

import type { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/src/lib/supabase/middleware";
import { type MiddlewareFunction, type MiddlewareContext, type AuthData } from "../core/types";

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
    
    const authData: AuthData = {
      status: authStatus,
      userId,
      userEmail,
      isAuthenticated: authStatus === 'authenticated'
    };
    
    context.data.auth = authData;
      // If auth middleware returns a redirect, return it immediately
    if (response.status >= 300 && response.status < 400) {
      // Auth middleware returning redirect
      return response;
    }
    
    // Otherwise continue with the response for potential modification by other middleware
    return response;
      } catch (_error) {
    // Auth middleware error
    // Don't block the request, continue to next middleware
    return null;
  }
};
