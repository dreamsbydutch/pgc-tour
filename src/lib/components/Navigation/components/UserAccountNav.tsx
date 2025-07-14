/**
 * UserAccountNav Component
 *
 * Handles user authentication state and account navigation
 */

"use client";

import { useState } from "react";
import { Skeleton } from "src/lib/components/functional/ui";
import { UserAccountNavMenu } from "./UserAccountNavMenu";
import { SignInButton } from "./SignInButton";
import { formatUserDisplayName } from "../utils";
import type { NavigationData } from "../utils/types";

interface UserAccountNavProps {
  navigationData: NavigationData;
}

export function UserAccountNav({ navigationData }: UserAccountNavProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, member, tourCards, champions, isLoading, tourCardLoading } =
    navigationData;

  if (isLoading || isSigningOut) {
    return (
      <Skeleton className="h-[1.5rem] w-[1.5rem] rounded-full lg:h-[2.5rem] lg:w-[2.5rem]" />
    );
  }

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
          {formatUserDisplayName(member.firstname, member.lastname)}
        </span>
      </div>
    );
  }

  return <SignInButton />;
}
