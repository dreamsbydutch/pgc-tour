"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
<<<<<<< Updated upstream
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
=======
} from "@/src/app/_components/ui/dropdown-menu";
>>>>>>> Stashed changes
import { Button } from "../ui/button";
import Link from "next/link";
import { useState, type Dispatch, type SetStateAction } from "react";

import { useRouter } from "next/navigation";
import { handleLogout } from "../../(auth)/signin/actions";
<<<<<<< Updated upstream
import type { Member } from "@prisma/client";
import { useUser } from "@/src/lib/hooks/use-user";
=======
import { useAuth } from "@/src/lib/store";
import { UserAvatar } from "../OptimizedImage";
>>>>>>> Stashed changes

/**
 * UserAccountNav Component
 *
 * Displays a dropdown menu for user account management.
 * - Shows user information such as avatar, name, and email.
 * - Provides options to edit user information, access admin features, and sign out.
 *
 * Props:
 * - user: The authenticated user object.
 * - size (optional): The size of the avatar ("small" or "large").
 * - setIsSigningOut: Function to set the signing-out state.
 */
export function UserAccountNav({
  size,
  setIsSigningOut,
}: {
  size?: "small" | "large";
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Get user from store
  const { user, member } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url as string ?? "";

  return (
    <div className="w-fit">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center">
<<<<<<< Updated upstream
          {user?.user_metadata.avatar_url && (
            <Image
              className="grid place-items-center rounded-full bg-border"
              src={(user?.user_metadata.avatar_url as string) ?? ""}
=======
          {avatarUrl && (
            <UserAvatar
              src={avatarUrl}
>>>>>>> Stashed changes
              alt="User Avatar"
              width={size === "small" ? 24 : 36}
              height={size === "small" ? 24 : 36}
            />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* User Information */}
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col gap-1 space-y-1 leading-none">
              <p className="w-[200px] truncate text-base font-bold text-slate-800">
                {member?.fullname ?? user?.user_metadata.full_name ?? "User"}
              </p>
              <p className="w-[200px] truncate text-sm text-slate-800">
                {member?.email ?? user?.user_metadata.email}
              </p>

              {/* Edit user info section */}
              {!isEditing && (
                <div
                  onClick={() => setIsEditing(true)}
                  className="flex cursor-pointer gap-2 text-sm underline"
                >
                  Edit user info
                </div>
              )}
              {/* {isEditing && <MemberUpdateForm {...{ user, setIsEditing }} />} */}
            </div>
          </div>

          {/* Admin Link */}
          {member?.role === "admin" && (
            <>
              <DropdownMenuSeparator />
              <Link href="/admin" className="ml-3 text-center underline">
                Admin
              </Link>
            </>
          )}

          {/* Sign Out Option */}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <Button
              className="w-full"
              onClick={() => handleLogout({ router, setIsSigningOut })}
            >
              Sign out
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
