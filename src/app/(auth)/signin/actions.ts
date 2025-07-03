import { toast } from "@/src/lib/hooks/useToast";
import { createClient } from "@/src/lib/supabase/client";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { Dispatch, SetStateAction } from "react";

export async function signInWithGoogle({
  setIsGoogleLoading,
}: {
  setIsGoogleLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const supabase = createClient();
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
  return;
}

export async function handleLogout({
  setIsSigningOut,
  router,
}: {
  setIsSigningOut: Dispatch<SetStateAction<boolean>>;
  router: AppRouterInstance;
}) {
  setIsSigningOut(true);
  const supabase = createClient();

  await supabase.auth.signOut();
  router.push("/signin");
  router.refresh();
  return;
}
