import { toast } from "@/src/lib/hooks/use-toast";
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
  
  console.log("🔐 Starting Google OAuth signin...");
  
  try {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log("🔄 OAuth redirect URL:", redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    console.log("📡 OAuth response:", { data: !!data, error: !!error });

    if (error) {
      throw error;
    }
    
    // Don't reset loading state here since we're redirecting
    console.log("✅ OAuth initiated successfully");
    
  } catch (error) {
    console.error("❌ OAuth signin error:", error);
    toast({
      title: "Please try again.",
      description: error instanceof Error ? error.message : "There was an error logging in with Google.",
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
