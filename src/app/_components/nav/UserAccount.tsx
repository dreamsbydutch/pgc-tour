import React from "react";
import { FaUser } from "react-icons/fa6";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "../SignOutButton";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

export function UserAccountNav({ user }: { user: User | null }) {
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
            <div className="flex flex-col gap-4 space-y-1 leading-none">
              {user?.user_metadata && (
                <>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user.user_metadata.name as string}
                  </p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <SignOutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
