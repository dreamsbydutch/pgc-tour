"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import { BookText, Home, List, LogIn, Trophy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/ui/skeleton";
import { cn } from "@/src/lib/utils";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const searchParamString = "?" + useSearchParams().toString();
  return (
    <div className={cn(className, "h-14")}>
      <Link href={"/" + searchParamString}>
        <Home size={"2.25rem"} />
      </Link>
      <Link href={"/tournament" + searchParamString}>
        <List size={"2.25rem"} />
      </Link>
      <Link href={"/standings" + searchParamString}>
        <Trophy size={"2.25rem"} />
      </Link>
      <Link href={"/rulebook" + searchParamString}>
        <BookText size={"2.25rem"} />
      </Link>
      <div className="flex min-w-[2.25rem] items-center justify-center">
        <ClerkLoading>
          <Skeleton className="h-[2.25rem] w-[2.25rem] rounded-full" />
        </ClerkLoading>
        <ClerkLoaded>
          <SignedOut>
            <SignInButton children={<LogIn size={"2.25rem"} />} />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </ClerkLoaded>
      </div>
    </div>
  );
}
