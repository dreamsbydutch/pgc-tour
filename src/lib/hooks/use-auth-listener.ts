"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/lib/auth/AuthContext";
import { authStoreService } from "@/src/lib/auth/AuthStoreService";

/**
 * Hook to synchronize authentication state with store
 * This replaces the old auth listener and integrates with the new AuthContext
 */
export function useAuthListener() {
  const { member, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Update store when auth state changes
    if (!isLoading) {
      authStoreService.updateStoreForAuth(member, isAuthenticated);
    }
  }, [member, isAuthenticated, isLoading]);

  // Subscribe to auth state changes for other components
  useEffect(() => {
    const unsubscribe = authStoreService.onAuthStateChange((update) => {
      console.log("🔐 Auth state change received:", update);
    });

    return unsubscribe;
  }, []);

  return {
    isAuthenticated,
    member,
    isLoading,
    // Expose store service methods for advanced use cases
    refreshUserData: authStoreService.refreshUserData.bind(authStoreService),
    hasValidSession: authStoreService.hasValidUserSession.bind(authStoreService),
  };
}
