/**
 * UserAccountNav Component
 *
 * Handles user authentication state and account navigation with error handling
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton, Button } from "src/lib/components/functional/ui";
import { UserAccountNavMenu } from "./UserAccountNavMenu";
import { SignInButton } from "./SignInButton";
import { formatUserDisplayName } from "../utils";
import type { NavigationData } from "../utils/types";

interface UserAccountNavProps {
  navigationData: NavigationData;
}

export function UserAccountNav({ navigationData }: UserAccountNavProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    user,
    member,
    tourCards,
    champions,
    isLoading,
    tourCardLoading,
    error,
    hasNetworkError,
    retryCount,
  } = navigationData;

  // Memoize display name to prevent unnecessary recalculations
  const displayName = useMemo(() => {
    if (!member?.firstname && !member?.lastname) return "User";
    return formatUserDisplayName(member.firstname, member.lastname);
  }, [member?.firstname, member?.lastname]);

  // Handle retry with feedback
  const handleRetry = useCallback(() => {
    if (error?.retry) {
      error.retry();
    }
  }, [error]);

  // Show loading state during auth or sign out
  if (isLoading || isSigningOut) {
    return (
      <div className="flex min-w-[2.5rem] items-center justify-center">
        <Skeleton className="h-[1.5rem] w-[1.5rem] rounded-full lg:h-[2.5rem] lg:w-[2.5rem]" />
      </div>
    );
  }

  // Show error state with retry option
  if (error && user && member) {
    return (
      <div className="flex min-w-[2.5rem] items-center justify-center gap-2">
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle size="1rem" />
          {hasNetworkError ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="h-6 px-2 text-xs"
              disabled={retryCount >= 3}
            >
              <RefreshCw size="0.8rem" className="mr-1" />
              Retry
            </Button>
          ) : (
            <span>Error</span>
          )}
        </div>
      </div>
    );
  }

  // Show authenticated user UI
  if (user && member) {
    return (
      <div className="flex min-w-[2.5rem] items-center justify-center lg:gap-2">
        <UserAccountNavMenu
          user={user}
          member={member}
          tourCards={tourCards}
          champions={champions}
          setIsSigningOut={setIsSigningOut}
          tourCardLoading={tourCardLoading}
        />
        <span className="hidden font-barlow text-2xl font-semibold lg:inline-block">
          {displayName}
        </span>
      </div>
    );
  }

  // Show sign in button for unauthenticated users
  return <SignInButton />;
}
