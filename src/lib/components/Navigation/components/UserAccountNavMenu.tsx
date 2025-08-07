/**
 * UserAccountNavMenu Component
 *
 * Dropdown menu for authenticated users showing account info and actions
 */

"use client";

import { useState, useMemo, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Skeleton,
} from "src/lib/components/functional/ui";
import { useInstallPWA, LittleFucker } from "@pgc-components";
import { formatMoney, formatNumber } from "@pgc-utils";
import { handleLogout } from "@app/(auth)/signin/actions";
import { MemberUpdateForm } from "./MemberUpdateForm";
import type {
  NavigationUser,
  NavigationMember,
  NavigationTourCard,
  NavigationChampion,
  NavigationError,
} from "../utils/types";

interface UserAccountNavMenuProps {
  user: NavigationUser;
  member: NavigationMember;
  tourCards: NavigationTourCard[];
  champions: NavigationChampion[];
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
  tourCardLoading: boolean;
}

export function UserAccountNavMenu({
  user,
  member,
  tourCards,
  champions,
  setIsSigningOut,
  tourCardLoading,
}: UserAccountNavMenuProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Defensive check for required props
  if (!user || !member) {
    console.warn("UserAccountNavMenu: Missing required user or member data");
    return null;
  }

  return (
    <div className="w-fit">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center">
          <UserAvatar user={user} />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <UserInfo
            user={user}
            member={member}
            tourCards={tourCards}
            champions={champions}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            tourCardLoading={tourCardLoading}
          />
          {member.role === "admin" && <AdminButton />}
          <InstallAppButton />
          <SignOutButton setIsSigningOut={setIsSigningOut} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function UserInfo({
  user,
  member,
  tourCards,
  champions,
  isEditing,
  setIsEditing,
  tourCardLoading,
}: {
  user: NavigationUser;
  member: NavigationMember;
  tourCards: NavigationTourCard[];
  champions: NavigationChampion[];
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  tourCardLoading: boolean;
}) {
  // Safely calculate user display name
  const displayName = useMemo(() => {
    const firstname = member?.firstname?.trim() || "";
    const lastname = member?.lastname?.trim() || "";
    return firstname || lastname ? `${firstname} ${lastname}`.trim() : "User";
  }, [member?.firstname, member?.lastname]);

  // Safely calculate tour card statistics with error handling
  const tourCardStats = useMemo(() => {
    if (!Array.isArray(tourCards)) {
      return {
        seasons: 0,
        tournaments: 0,
        wins: 0,
        topTens: 0,
        points: 0,
        earnings: 0,
      };
    }

    try {
      return tourCards.reduce(
        (stats, card) => {
          // Defensive null checks for each property
          stats.seasons += 1;
          stats.tournaments += Number(card?.appearances) || 0;
          stats.wins += Number(card?.win) || 0;
          stats.topTens += Number(card?.topTen) || 0;
          stats.points += Number(card?.points) || 0;
          stats.earnings += Number(card?.earnings) || 0;
          return stats;
        },
        {
          seasons: 0,
          tournaments: 0,
          wins: 0,
          topTens: 0,
          points: 0,
          earnings: 0,
        },
      );
    } catch (error) {
      console.error("Error calculating tour card stats:", error);
      return {
        seasons: 0,
        tournaments: 0,
        wins: 0,
        topTens: 0,
        points: 0,
        earnings: 0,
      };
    }
  }, [tourCards]);

  return (
    <div className="flex items-center justify-start gap-2 p-2">
      <div className="flex flex-col gap-1 space-y-1 leading-none">
        <div className="flex w-[200px] flex-row gap-2 truncate text-base font-bold text-slate-800">
          <UserAvatar user={user} size="small" />
          {displayName}
        </div>
        <p className="w-[200px] truncate text-base text-slate-800">
          {member?.email || "No email"}
        </p>
        {Array.isArray(champions) && champions.length > 0 && (
          <LittleFucker champions={champions} showSeasonText />
        )}
        {!tourCardLoading && (
          <div className="flex w-[200px] flex-col text-sm text-slate-800">
            <p>
              {`${tourCardStats.seasons} seasons - ${tourCardStats.tournaments} tournaments`}
            </p>
            <p>
              {`${formatNumber(tourCardStats.wins)} wins - ${formatNumber(tourCardStats.topTens)} top tens`}
            </p>
            <p>
              {`${formatNumber(tourCardStats.points)} pts - ${formatMoney(tourCardStats.earnings)}`}
            </p>
          </div>
        )}

        {!isEditing ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-sm"
          >
            Edit user info
          </Button>
        ) : (
          <MemberUpdateForm member={member} setIsEditing={setIsEditing} />
        )}
      </div>
    </div>
  );
}

function AdminButton() {
  const router = useRouter();
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/admin")}
          className="w-full"
        >
          Admin
        </Button>
      </DropdownMenuItem>
    </>
  );
}

function InstallAppButton() {
  const { isInstallable, isInstalled, installApp } = useInstallPWA();
  if (!isInstallable || isInstalled) return null;
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Button
          variant="secondary"
          size="sm"
          onClick={installApp}
          className="w-full"
        >
          Install App
        </Button>
      </DropdownMenuItem>
    </>
  );
}

function SignOutButton({
  setIsSigningOut,
}: {
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Button
          className="w-full"
          variant="destructive"
          onClick={() => handleLogout({ router, setIsSigningOut })}
        >
          Sign out
        </Button>
      </DropdownMenuItem>
    </>
  );
}

function UserAvatar({
  user,
  size = "large",
}: {
  user: NavigationUser;
  size?: "small" | "large";
}) {
  if (!user?.avatar) {
    return <Skeleton className="h-6 w-6 rounded-full bg-gray-200" />;
  }

  return (
    <Image
      className="grid place-items-center rounded-full bg-border"
      src={user.avatar}
      alt="User Avatar"
      width={size === "small" ? 24 : 36}
      height={size === "small" ? 24 : 36}
    />
  );
}
