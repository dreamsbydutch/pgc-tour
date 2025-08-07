/**
 * ErrorBoundary Component
 *
 * Catches and handles errors in navigation components
 */

"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "src/lib/components/functional/ui";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

const MAX_RETRIES = 3;

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "Navigation ErrorBoundary caught an error:",
      error,
      errorInfo,
    );

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = MAX_RETRIES } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn("Maximum retry attempts reached for navigation component");
      return;
    }

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Retry with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }, delay);
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, retryCount } = this.state;
    const { children, fallback, maxRetries = MAX_RETRIES } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="flex h-[55px] w-full items-center justify-center bg-gray-200 px-4">
          <div className="flex items-center gap-3 text-sm">
            <AlertTriangle size="1.2rem" className="text-red-500" />
            <span className="text-gray-700">Navigation error occurred</span>
            {retryCount < maxRetries ? (
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="h-7 px-3 text-xs"
              >
                <RefreshCw size="0.8rem" className="mr-1" />
                Retry
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                className="h-7 px-3 text-xs"
              >
                <RefreshCw size="0.8rem" className="mr-1" />
                Reload
              </Button>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
