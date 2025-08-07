/**
 * Enhanced Error Boundary Hook and Component
 *
 * Provides error boundary functionality with retry logic and detailed error reporting
 */

"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react";
import { Button } from "src/lib/components/functional/ui";

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface NavigationError {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
}

interface UseErrorBoundaryReturn {
  error: NavigationError | null;
  hasError: boolean;
  resetError: () => void;
  captureError: (error: Error, errorInfo?: ErrorInfo) => void;
}

/**
 * Custom hook for error boundary functionality
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = useState<NavigationError | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error, errorInfo?: ErrorInfo) => {
    const navigationError: NavigationError = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date(),
    };

    setError(navigationError);

    // Log to console for debugging
    console.error("Navigation Error Captured:", {
      error,
      errorInfo,
      timestamp: navigationError.timestamp,
    });
  }, []);

  // Global error handler
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn("Unhandled promise rejection in navigation:", event.reason);
      if (event.reason instanceof Error) {
        captureError(event.reason);
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.warn("Unhandled error in navigation:", event.error);
      if (event.error instanceof Error) {
        captureError(event.error);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, [captureError]);

  return {
    error,
    hasError: !!error,
    resetError,
    captureError,
  };
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: NavigationError) => void;
  showDetails?: boolean;
}

/**
 * Functional Error Boundary Component
 */
export function ErrorBoundary({
  children,
  fallback,
  onError,
  showDetails = false,
}: ErrorBoundaryProps) {
  const { error, hasError, resetError } = useErrorBoundary();
  const [retryCount, setRetryCount] = useState(0);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const MAX_RETRIES = 3;

  // Call error handler when error occurs
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) {
      window.location.reload();
      return;
    }

    setRetryCount((prev) => prev + 1);
    resetError();
  }, [retryCount, resetError]);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  if (hasError && error) {
    // Use custom fallback if provided
    if (fallback) {
      return (
        <div className="relative">
          {fallback}
          {showDetails && (
            <div className="absolute left-0 top-0 w-full border border-red-200 bg-red-50 p-2 text-xs">
              <pre className="whitespace-pre-wrap text-red-700">
                {error.message}
              </pre>
            </div>
          )}
        </div>
      );
    }

    // Default error UI
    return (
      <div className="flex h-[55px] w-full items-center justify-center bg-gray-200 px-4">
        <div className="flex items-center gap-3 text-sm">
          <AlertTriangle size="1.2rem" className="text-red-500" />
          <div className="flex flex-col gap-1">
            <span className="text-gray-700">Navigation error occurred</span>
            {showErrorDetails && (
              <span className="text-xs text-red-600">{error.message}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="h-7 px-2 text-xs"
              >
                <Bug size="0.8rem" className="mr-1" />
                Details
              </Button>
            )}

            {retryCount < MAX_RETRIES ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-7 px-3 text-xs"
              >
                <RefreshCw size="0.8rem" className="mr-1" />
                Retry ({MAX_RETRIES - retryCount} left)
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
                className="h-7 px-3 text-xs"
              >
                <RefreshCw size="0.8rem" className="mr-1" />
                Reload Page
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
