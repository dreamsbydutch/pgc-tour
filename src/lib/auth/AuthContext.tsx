"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useMainStore } from "@/src/lib/store/store";
import { authStoreService } from "./AuthStoreService";
import { refreshWithMiddlewareCoordination } from "@/src/lib/store/cacheInvalidation";
import type { User, Session } from "@supabase/supabase-js";
import type { Member } from "@prisma/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  member: Member | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    member: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const supabase = createClient();
  const isInitializing = useRef(false);
  const _store = useMainStore(); // Using underscore prefix to mark as intentionally unused

  // Fetch member data from API
  const fetchMemberData = async (_userId: string): Promise<Member | null> => {
    try {
      const response = await fetch("/api/members/current", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch member: ${response.status}`);
      }
      
      const data = await response.json();
      return data.member;
    } catch (error) {
      console.error("Failed to fetch member data:", error);
      return null;
    }
  };

  // Update both auth context and main store with enhanced coordination
  const updateAuthState = async (user: User | null, session: Session | null) => {
    if (isInitializing.current) {
      console.log("⏳ Auth update already in progress, skipping...");
      return;
    }

    isInitializing.current = true;
    console.log("🔐 Updating auth state with middleware coordination:", { user: !!user, session: !!session });

    try {
      let member: Member | null = null;
      
      if (user) {
        // Fetch member data with retry logic for better reliability
        let retries = 3;
        while (retries > 0 && !member) {
          member = await fetchMemberData(user.id);
          if (!member && retries > 1) {
            console.log(`⏳ Retrying member fetch... ${retries - 1} attempts left`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          retries--;
        }
      }

      const isAuthenticated = !!user && !!session;
      
      const newAuthState: AuthState = {
        user,
        session,
        member,
        isAuthenticated,
        isLoading: false,
        error: null,
      };

      setAuthState(newAuthState);

      // Update store through authStoreService for proper coordination
      await authStoreService.updateStoreForAuth(member, isAuthenticated);

      // Check for middleware coordination if available
      if (typeof window !== 'undefined' && isAuthenticated) {
        try {
          const coordResult = await refreshWithMiddlewareCoordination();
          console.log("Middleware coordination result:", coordResult);
        } catch (error) {
          console.warn("Middleware coordination failed (non-critical):", error);
        }
      }

      console.log("✅ Auth state updated with coordination:", {
        authenticated: newAuthState.isAuthenticated,
        memberFound: !!member,
        memberEmail: member?.email,
      });

    } catch (error) {
      console.error("❌ Error updating auth state:", error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Authentication error",
      }));
    } finally {
      isInitializing.current = false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log("🔄 Initializing auth provider...");

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        await updateAuthState(session?.user ?? null, session);
      } catch (error) {
        console.error("❌ Failed to get initial session:", error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to initialize auth",
        }));
      }
    };

    void getInitialSession(); // Using void operator to acknowledge the floating promise

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 Auth state change detected:", event, !!session);
        
        // Handle different auth events
        switch (event) {
          case "SIGNED_IN":
            console.log("✅ User signed in");
            await updateAuthState(session?.user ?? null, session);
            break;
            
          case "SIGNED_OUT":
            console.log("👋 User signed out");
            await updateAuthState(null, null);
            break;
            
          case "TOKEN_REFRESHED":
            console.log("🔄 Token refreshed");
            await updateAuthState(session?.user ?? null, session);
            break;
            
          default:
            console.log("📝 Auth event:", event);
            await updateAuthState(session?.user ?? null, session);
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, updateAuthState]);

  // Auth context methods with enhanced coordination
  const signOut = async () => {
    console.log("👋 Signing out with coordination...");
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear store state through authStoreService
      await authStoreService.updateStoreForAuth(null, false);
      
      console.log("✅ Sign out successful");
    } catch (error) {
      console.error("❌ Sign out error:", error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      }));
    }
  };

  const refreshAuth = async () => {
    console.log("🔄 Refreshing auth state with coordination...");
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      await updateAuthState(session?.user ?? null, session);
    } catch (error) {
      console.error("❌ Auth refresh error:", error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Auth refresh failed",
      }));
    }
  };

  const clearAuthError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    signOut,
    refreshAuth,
    clearAuthError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
