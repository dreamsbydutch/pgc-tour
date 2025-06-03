"use client";

import { useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { forceCacheInvalidation } from "@/src/lib/store/storeUtils";

/**
 * Hook to listen for authentication state changes and refresh store accordingly
 */
export function useAuthListener() {
  useEffect(() => {
    const supabase = createClient();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state change:", event, !!session);

      if (event === "SIGNED_IN" && session) {
        console.log("✅ User signed in, refreshing store...");
        try {
          await forceCacheInvalidation();
          console.log("✅ Store refreshed after sign-in");
        } catch (error) {
          console.error("❌ Failed to refresh store after sign-in:", error);
        }
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out, refreshing store...");
        try {
          await forceCacheInvalidation();
          console.log("✅ Store refreshed after sign-out");
        } catch (error) {
          console.error("❌ Failed to refresh store after sign-out:", error);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
