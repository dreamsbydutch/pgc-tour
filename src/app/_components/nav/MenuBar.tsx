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
    <div className={cn(className, "h-[55px] text-center")}>
      <NavItem href={"/"}>
        <Home size={"2.5rem"} className="mx-auto" />
        {/* <span className="font-barlow text-sm font-semibold">HOME</span> */}
      </NavItem>
      <NavItem href={"/tournament"}>
        <List size={"2.5rem"} className="mx-auto" />
        {/* <span className="font-barlow text-sm font-semibold">LEADERBOARD</span> */}
      </NavItem>
      <NavItem href={"/standings"}>
        <Trophy size={"2.5rem"} className="mx-auto" />
        {/* <span className="font-barlow text-sm font-semibold">STANDINGS</span> */}
      </NavItem>
      <NavItem href={"/rulebook"}>
        <BookText size={"2.5rem"} className="mx-auto" />
        {/* <span className="font-barlow text-sm font-semibold">RULEBOOK</span> */}
      </NavItem>
      <div className="flex min-w-[2.5rem] items-center justify-center">
        {loading || isSigningOut ? (
          <Skeleton className="h-[2.5rem] w-[2.5rem] rounded-full" />
        ) : user ? (
          <>
            <UserAccountNav {...{ user, setIsSigningOut }} />
          </>
        ) : (
          <div onClick={() => signInWithGoogle({ setIsGoogleLoading })}>
            {isGoogleLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <LogInIcon size={"2.25rem"} className="mx-auto" />
                {/* <span className="font-barlow text-sm font-semibold">
                  LOG IN
                </span> */}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
