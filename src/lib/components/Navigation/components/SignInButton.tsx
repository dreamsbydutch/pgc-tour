/**
 * SignInButton Component
 *
 * Handles sign-in functionality with Google OAuth and comprehensive error handling
 */

"use client";

import { useState, useCallback } from "react";
import { LogInIcon, AlertTriangle } from "lucide-react";
import { Button } from "src/lib/components/functional/ui";
import { signInWithGoogle } from "@app/(auth)/signin/actions";

export function SignInButton() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;

  const handleSignIn = useCallback(async () => {
    if (isGoogleLoading) return;

    try {
      setError(null);
      await signInWithGoogle({ setIsGoogleLoading });
      setRetryCount(0); // Reset on success
    } catch (err) {
      console.error("Sign in error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
    }
  }, [isGoogleLoading]);

  // Show error state if sign in failed and we haven't exceeded retry limit
  if (error && retryCount < MAX_RETRIES) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full p-0 lg:w-auto lg:px-3"
          onClick={handleSignIn}
          disabled={isGoogleLoading}
        >
          <LogInIcon size="1.5rem" className="lg:mr-2" />
          <span className="hidden font-barlow text-2xl font-semibold lg:inline-block">
            {isGoogleLoading ? "RETRYING..." : "RETRY SIGN IN"}
          </span>
        </Button>
        <div className="hidden items-center gap-1 text-xs text-red-600 lg:flex">
          <AlertTriangle size="0.8rem" />
          <span>Sign in failed</span>
        </div>
      </div>
    );
  }

  // Show error state if we've exceeded retry limit
  if (error && retryCount >= MAX_RETRIES) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full p-0 lg:w-auto lg:px-3"
          onClick={() => window.location.reload()}
        >
          <AlertTriangle size="1.5rem" className="text-red-500 lg:mr-2" />
          <span className="hidden font-barlow text-2xl font-semibold text-red-600 lg:inline-block">
            RELOAD PAGE
          </span>
        </Button>
        <div className="hidden items-center text-xs text-red-600 lg:flex">
          <span>Multiple sign in attempts failed</span>
        </div>
      </div>
    );
  }

  // Normal sign in button
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full p-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:w-auto lg:px-3"
      onClick={handleSignIn}
      disabled={isGoogleLoading}
      aria-label="Sign in with Google"
    >
      <LogInIcon size="1.5rem" className="lg:mr-2" aria-hidden="true" />
      <span className="hidden font-barlow text-2xl font-semibold lg:inline-block">
        {isGoogleLoading ? "SIGNING IN..." : "SIGN IN"}
      </span>
    </Button>
  );
}
