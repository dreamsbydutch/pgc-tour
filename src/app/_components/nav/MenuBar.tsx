"use client";

import { BookText, Home, List, LogInIcon, Trophy } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { NavItem } from "./NavItem";
import { useUser } from "@/src/lib/hooks/use-user";
import { Skeleton } from "../ui/skeleton";
import { UserAccountNav } from "./UserAccount";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const { user, loading } = useUser();
  console.log(loading);
  console.log(user);
  console.log(user);
  return (
    <div className={cn(className, "h-14")}>
      <NavItem href={"/"}>
        <Home size={"2.25rem"} />
      </NavItem>
      <NavItem href={"/tournament"}>
        <List size={"2.25rem"} />
      </NavItem>
      <NavItem href={"/standings"}>
        <Trophy size={"2.25rem"} />
      </NavItem>
      <NavItem href={"/rulebook"}>
        <BookText size={"2.25rem"} />
      </NavItem>
      <div className="flex min-w-[2.25rem] items-center justify-center">
        {loading ? (
          <Skeleton className="h-[2.25rem] w-[2.25rem] rounded-full" />
        ) : user ? (
          <>
            <UserAccountNav user={user} />
          </>
        ) : (
          <NavItem href={"/signin"}>
            <LogInIcon size={"2.25rem"} />
          </NavItem>
        )}
      </div>
    </div>
  );
}
