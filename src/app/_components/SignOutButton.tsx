"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { api } from "@/src/trpc/react";

export function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();
  const utils = api.useUtils();

  async function handleLogout() {
    await supabase.auth.signOut();
    await utils.invalidate();
    router.push("/signin");
    router.refresh()
  }

  return (
    <Button className="w-full" onClick={() => handleLogout()}>
      Sign out
    </Button>
  );
}
