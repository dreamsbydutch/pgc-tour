"use client";

import React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

interface StoreErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetErrorBoundary: () => void;
  }>;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="max-w-md p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto mb-4 h-16 w-16 text-red-500">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Something went wrong
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            {error.message ||
              "An unexpected error occurred while loading the data."}
          </p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/**
 * Store-specific error boundary that integrates with React Query
 * and provides graceful error handling for store operations
 */
export function StoreErrorBoundary({
  children,
  fallback: Fallback = DefaultErrorFallback,
}: StoreErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={Fallback}
          onReset={reset}
          onError={(error, errorInfo) => {
            // Log error to monitoring service
            console.error(
              "Store Error Boundary caught an error:",
              error,
              errorInfo,
            );

            // In production, you would send this to your error tracking service
            if (process.env.NODE_ENV === "production") {
              // Example: sendToErrorTracking(error, errorInfo);
            }
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

/**
 * Hook for handling store errors with consistent error reporting
 */
export function useStoreErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Store Error${context ? ` in ${context}` : ""}:`, error);

    // In production, report to error tracking service
    if (process.env.NODE_ENV === "production") {
      // Example: reportError(error, { context });
    }
  }, []);

  return { handleError };
}

/**
 * Utility for creating consistent error objects
 */
export function createStoreError(
  message: string,
  code: string,
  details?: Record<string, any>,
): Error & { code: string; details?: Record<string, any> } {
  const error = new Error(message) as Error & {
    code: string;
    details?: Record<string, any>;
  };
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Error codes for different store operations
 */
export const STORE_ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TOURNAMENT_NOT_FOUND: "TOURNAMENT_NOT_FOUND",
  LEADERBOARD_FETCH_FAILED: "LEADERBOARD_FETCH_FAILED",
  USER_AUTH_FAILED: "USER_AUTH_FAILED",
  STORE_SYNC_FAILED: "STORE_SYNC_FAILED",
  INVALID_DATA: "INVALID_DATA",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;
