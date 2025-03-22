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

  if (typeof window === "undefined")
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
  const width = window.innerWidth;

  return width < 1000 ? (
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
  ) : (
    <DesktopNav
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
    <div
      className={cn(
        className,
        "shadow-inv fixed bottom-0 z-20 flex w-full items-center justify-evenly bg-gray-200",
        "h-[55px] text-center",
      )}
    >
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

function DesktopNav({
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
    <div
      className={cn(
        className,
        "shadow-inv fixed top-0 z-20 flex w-full items-center justify-center gap-6 bg-gray-200 px-4 py-2",
        "h-[55px] text-center",
      )}
    >
      <NavItem href={"/"}>
        <div className="flex items-center justify-center gap-2">
          <Home size={"1.5rem"} className="mx-auto" />
          <span className="font-barlow text-2xl font-semibold">HOME</span>
        </div>
      </NavItem>
      <NavItem href={"/tournament"}>
        <div className="flex items-center justify-center gap-2">
          <List size={"1.5rem"} className="mx-auto" />
          <span className="font-barlow text-2xl font-semibold">
            LEADERBOARD
          </span>
        </div>
      </NavItem>
      <NavItem href={"/standings"}>
        <div className="flex items-center justify-center gap-2">
          <Trophy size={"1.5rem"} className="mx-auto" />
          <span className="font-barlow text-2xl font-semibold">STANDINGS</span>
        </div>
      </NavItem>
      <NavItem href={"/rulebook"}>
        <div className="flex items-center justify-center gap-2">
          <BookText size={"1.5rem"} className="mx-auto" />
          <span className="font-barlow text-2xl font-semibold">RULEBOOK</span>
        </div>
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
