"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { Button } from "../ui/button";
import Link from "next/link";
import { handleLogout } from "../../signin/actions";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/trpc/react";
import MemberUpdateForm from "../MemberUpdateForm";

export function UserAccountNav({
  user,
  setIsSigningOut,
}: {
  user: User | null;
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const member = api.member.getById.useQuery({ memberId: user?.id }).data;

  return (
    <div className="w-fit space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center space-x-1">
          <Image
            className="grid place-items-center rounded-full bg-border"
            src={user?.user_metadata.avatar_url as string}
            alt=""
            width={30}
            height={30}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col gap-1 space-y-1 leading-none">
              <p className="w-[200px] truncate text-base font-bold text-slate-800">
                {member?.fullname}
              </p>
              <p className="w-[200px] truncate text-sm text-slate-800">
                {member?.email}
              </p>
              <MemberUpdateForm {...{ user }} />
            </div>
          </div>

          {member?.role === "admin" && (
            <>
              <DropdownMenuSeparator />
              <Link href="/admin" className="mx-4 text-center">
                Admin
              </Link>
            </>
          )}
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
