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
        console.log("✅ User signed in, checking for auth success handler...");
        
        // Check if we have auth_success parameter indicating redirect from callback
        const hasAuthSuccess = typeof window !== "undefined" && 
          new URLSearchParams(window.location.search).get("auth_success") === "true";
        
        if (hasAuthSuccess) {
          console.log("🔗 Auth success parameter detected, letting AuthSuccessHandler handle refresh");
          return; // Let AuthSuccessHandler handle the refresh
        }
        
        // For direct sign-ins without redirect, wait for session propagation
        console.log("⏰ Direct sign-in detected, waiting for session propagation...");
        setTimeout(() => {
          console.log("🔄 Session propagated, refreshing store...");
          resetInitialization();
        }, 2000); // 2 second delay for session propagation
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out, marking for store refresh...");
        // Sign out can be immediate - no session propagation needed
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
