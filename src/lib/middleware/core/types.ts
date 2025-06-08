/**
 * Middleware Types
 * 
 * Type definitions for the middleware system
 */

import type { NextRequest, NextResponse } from "next/server";

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

export interface MiddlewareConfig {
  name: string;
  priority: number;
  enabled?: boolean;
  function: MiddlewareFunction;
}

export interface AuthData {
  status: string | null;
  userId: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
}

export interface SecurityData {
  headersApplied: boolean;
  headers: string[];
}

export interface RateLimitData {
  checked: boolean;
  ip: string;
  pathname: string;
}

export interface AnalyticsData {
  tracked: boolean;
  pathname: string;
  timestamp: number;
}
