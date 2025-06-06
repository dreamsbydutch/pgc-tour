/**
 * Streamlined Authentication System
 * 
 * Simplified auth context that integrates directly with the main store
 * Removed complex coordination layers in favor of straightforward state management
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useMainStore } from "../store/store";
import { refreshUserData } from "../store/mainInit";
import { log } from "@/src/lib/logging";
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

  // Fetch member data from API
  const fetchMemberData = useCallback(async (): Promise<Member | null> => {
    try {
      const response = await fetch("/api/members/current", {
        cache: "no-store",
      });
      
      if (!response.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error(`Failed to fetch member: ${response.status}`);
        }
        return null;
      }
      
      const data = await response.json() as { member: Member | null };
      return data.member;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch member data:", error);
      }
      return null;
    }
  }, []);

  // Update auth state and sync with main store
  const updateAuthState = useCallback(async (user: User | null, session: Session | null) => {
    try {
      let member: Member | null = null;
      
      if (user && session) {
        // Fetch member data with simple retry
        for (let i = 0; i < 2; i++) {
          member = await fetchMemberData();
          if (member || i === 1) break;
          await new Promise(resolve => setTimeout(resolve, 500));
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

      // Sync with main store
      useMainStore.getState().setAuthState(member, isAuthenticated);

      // Refresh user-specific data if authenticated
      if (member && isAuthenticated) {
        await refreshUserData(member);
      }

      log.auth.stateChange('Auth state updated', { 
        hasSession: isAuthenticated, 
        userEmail: member?.email 
      });
    } catch (error) {
      log.auth.error("Auth state update failed", error as Error);
      
      const errorState: AuthState = {
        user: null,
        session: null,
        member: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };

      setAuthState(errorState);
      useMainStore.getState().setAuthState(null, false);
    }
  }, [fetchMemberData]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear auth state
      const signedOutState: AuthState = {
        user: null,
        session: null,
        member: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

      setAuthState(signedOutState);
      useMainStore.getState().setAuthState(null, false);

      console.log('✅ Successfully signed out');
    } catch (error) {
      console.error("❌ Sign out failed:", error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      }));
    }
  }, [supabase.auth]);

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      await updateAuthState(session?.user ?? null, session);
    } catch (error) {
      console.error("❌ Auth refresh failed:", error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Auth refresh failed",
      }));
    }
  }, [supabase.auth, updateAuthState]);

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (mounted) {
          await updateAuthState(session?.user ?? null, session);
        }
      } catch (error) {
        console.error("❌ Auth initialization failed:", error);
        
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            member: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : "Auth initialization failed",
          });
        }
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
    };
  }, [updateAuthState, supabase.auth]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log.auth.stateChange(`Auth state change: ${event}`, { 
          hasSession: !!session,
          userEmail: session?.user?.email 
        });
        
        if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            member: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          useMainStore.getState().setAuthState(null, false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await updateAuthState(session?.user ?? null, session);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [updateAuthState, supabase.auth]);

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

// Auth utilities for use outside React components
export const authUtils = {
  // Get current auth state from store
  getAuthState: () => {
    const state = useMainStore.getState();
    return {
      isAuthenticated: state.isAuthenticated,
      member: state.currentMember,
      tourCard: state.currentTourCard,
      tour: state.currentTour,
    };
  },

  // Sign out from store
  signOut: () => {
    useMainStore.getState().setAuthState(null, false);
  },

  // Check if user has admin access
  isAdmin: () => {
    const { member } = authUtils.getAuthState();
    return member?.role === 'ADMIN';
  },

  // Check if user is in a specific tour
  isInTour: (tourId: string) => {
    const { tour } = authUtils.getAuthState();
    return tour?.id === tourId;
  },
};

// Make available in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).authUtils = authUtils;
}
