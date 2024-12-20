"use client";

import { BookText, Home, List, LogInIcon, Trophy } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { NavItem } from "./NavItem";
import { useUser } from "@/src/lib/hooks/use-user";
import { Skeleton } from "../ui/skeleton";
import { UserAccountNav } from "./UserAccount";
import { createClient } from "@/src/lib/supabase/client";
import { useState } from "react";
import { toast } from "@/src/lib/hooks/use-toast";
import LoadingSpinner from "../LoadingSpinner";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const { user, loading } = useUser();
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const supabase = createClient();

  async function signInWithGoogle() {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (_error) {
      toast({
        title: "Please try again.",
        description: "There was an error logging in with Google.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  }
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
          <div onClick={() => signInWithGoogle}>
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
