/**
 * Logging Provider Component
 * 
 * This component integrates our logging system with Next.js App Router
 * by providing context-aware logging capabilities.
 */

"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { log } from '@/src/lib/logging';

interface LoggingProviderProps {
  children: ReactNode;
}

/**
 * Provides logging context to the application
 * Logs page navigation and captures errors
 */
export default function LoggingProvider({ children }: LoggingProviderProps) {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  
  // Log page navigations
  useEffect(() => {
    // Skip initial render
    if (previousPathname.current !== null) {
      log.info('Page navigation', { 
        from: previousPathname.current, 
        to: pathname 
      });
    }
    
    previousPathname.current = pathname;
  }, [pathname]);
  
  // Set up global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorStack = event.error instanceof Error ? event.error.stack : undefined;
      // Pass error context as the third argument (context) instead of as the second (error object)
      log.error('Unhandled client error', event.error instanceof Error ? event.error : undefined, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: errorStack,
        path: pathname
      });
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      const reasonStack = event.reason instanceof Error ? event.reason.stack : undefined;
      // Pass the error as second argument and context as third
      log.error('Unhandled promise rejection', 
        event.reason instanceof Error ? event.reason : new Error(reason),
        {
          path: pathname,
          stack: reasonStack
        }
      );
    };
    
    // Add listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      // Remove listeners on unmount
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [pathname]);
  
  return <>{children}</>;
}
