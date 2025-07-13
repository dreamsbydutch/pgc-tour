/**
 * UserAccountNavMenu Component
 *
 * Dropdown menu for authenticated users showing account info and actions
 */

"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
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
} from "@pgc-ui";
import { useInstallPWA, LittleFucker } from "@pgc-components";
import { formatMoney, formatNumber } from "@pgc-utils";
import { handleLogout } from "@app/(auth)/signin/actions";
import { MemberUpdateForm } from "./MemberUpdateForm";
import type {
  NavigationUser,
  NavigationMember,
  NavigationTourCard,
  NavigationChampion,
} from "../utils/types";

interface UserAccountNavMenuProps {
  user: NavigationUser;
  member: NavigationMember;
  tourCards: NavigationTourCard[];
  champions?: NavigationChampion[] | null;
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
  tourCardLoading?: boolean; // Optional for loading state of tour cards
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
  champions?: NavigationChampion[] | null;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  tourCardLoading?: boolean; // Optional for loading state of tour cards
}) {
  return (
    <div className="flex items-center justify-start gap-2 p-2">
      <div className="flex flex-col gap-1 space-y-1 leading-none">
        <div className="flex w-[200px] flex-row gap-2 truncate text-base font-bold text-slate-800">
          <UserAvatar user={user} size="small" />
          {member.firstname + " " + member.lastname}
        </div>
        <p className="w-[200px] truncate text-base text-slate-800">
          {member.email}
        </p>
        {champions && <LittleFucker champions={champions} showSeasonText />}
        {!tourCardLoading && (
          <div className="flex w-[200px] flex-col text-sm text-slate-800">
            <p>
              {`${tourCards.length} seasons - ${tourCards.reduce((p, c) => (p += c.appearances ?? 0), 0)} tournaments`}
            </p>
            <p>
              {`${formatNumber(tourCards.reduce((p, c) => (p += c.win ?? 0), 0))} wins - ${formatNumber(tourCards.reduce((p, c) => (p += c.topTen ?? 0), 0))} top tens`}
            </p>
            <p>
              {`${formatNumber(tourCards.reduce((p, c) => (p += c.points ?? 0), 0))} pts - ${formatMoney(tourCards.reduce((p, c) => (p += c.earnings ?? 0), 0))}`}
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
