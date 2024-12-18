import React from "react";
import { FaUser } from "react-icons/fa6";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignInButton } from "../SignInButton";
import { SignOutButton } from "../SignOutButton";
import { createClient } from "@/src/lib/supabase/client";

export async function UserAccountNav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SignInButton />;
  }

  return (
    <div className="w-max space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center space-x-1">
          <div className="grid size-7 place-items-center rounded-full bg-border">
            <FaUser className="text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user.email && (
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
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
