"use client";

import { BookText, Home, List, LogInIcon, Trophy } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { NavItem } from "./NavItem";
import { useUser } from "@/src/lib/hooks/use-user";
import { Skeleton } from "../ui/skeleton";
import { UserAccountNav } from "./UserAccount";
import { type Dispatch, type SetStateAction, useState } from "react";
import LoadingSpinner from "../LoadingSpinner";
import { signInWithGoogle } from "../../signin/actions";
import type { User } from "@supabase/supabase-js";

export default function MenuBar({ className }: { className?: string }) {
  const { user, loading } = useUser();
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  return (
    <Navbar
      {...{
        className,
        user,
        loading,
        isSigningOut,
        setIsSigningOut,
        isGoogleLoading,
        setIsGoogleLoading,
      }}
    />
  );
}

function Navbar({
  className,
  user,
  loading,
  isSigningOut,
  setIsSigningOut,
  isGoogleLoading,
  setIsGoogleLoading,
}: {
  className?: string;
  user: User | null;
  loading: boolean;
  isSigningOut: boolean;
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
  isGoogleLoading: boolean;
  setIsGoogleLoading: Dispatch<SetStateAction<boolean>>;
}) {
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
        {loading || isSigningOut ? (
          <Skeleton className="h-[2.25rem] w-[2.25rem] rounded-full" />
        ) : user ? (
          <>
            <UserAccountNav {...{ user, setIsSigningOut }} />
          </>
        ) : (
          <div onClick={() => signInWithGoogle({ setIsGoogleLoading })}>
            {isGoogleLoading ? (
              <LoadingSpinner />
            ) : (
              <LogInIcon size={"2.25rem"} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
