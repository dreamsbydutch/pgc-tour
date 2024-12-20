"use client";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { api } from "@/src/trpc/react";
import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

export function SignOutButton() {
  const supabase = createClient();
  const utils = api.useUtils();

  const [isLoading,setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    await supabase.auth.signOut();
    await utils.invalidate();
    redirect("/signin")
  }
  if (isLoading) <LoadingSpinner className="h-full" />
  return (
    <Button className="w-full" onClick={() => handleLogout()}>
      Sign out
    </Button>
  );
}
