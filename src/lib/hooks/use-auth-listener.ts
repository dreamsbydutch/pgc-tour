"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { resetInitialization } from "@/src/lib/store/useInitStore";

/**
 * Hook to listen for authentication state changes and handle store accordingly
 */
export function useAuthListener() {
  const isInitializing = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state change:", event, !!session);

      // Prevent recursive calls during initialization
      if (isInitializing.current) {
        console.log("⏳ Skipping auth listener - initialization in progress");
        return;
      }

      if (event === "SIGNED_IN" && session) {
        console.log("✅ User signed in, marking for store refresh...");
        // Just reset initialization flag - let the normal flow handle the refresh
        resetInitialization();
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out, marking for store refresh...");
        // Just reset initialization flag - let the normal flow handle the refresh
        resetInitialization();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Expose initialization state for other components to check
  return {
    setInitializing: (value: boolean) => {
      isInitializing.current = value;
    }
  };
}
