"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "./client";
import type { User } from "@supabase/supabase-js";
import type { Member } from "@prisma/client";

// Types
interface AuthState {
  user: User | null;
  member: Member | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Constants
const ADMIN_EMAIL = "chough14@gmail.com";

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    member: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
  });

  const supabase = createClient();

  // Fetch member data
  const fetchMember = useCallback(async (userId: string): Promise<Member | null> => {
    try {
      const response = await fetch(`/api/auth/member?userId=${userId}`, {
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.member;
    } catch {
      return null;
    }
  }, []);

  // Update auth state
  const updateAuthState = useCallback(async (user: User | null) => {
    let member: Member | null = null;
    
    if (user) {
      member = await fetchMember(user.id);
    }

    const isAuthenticated = !!user;
    const isAdmin = user?.email === ADMIN_EMAIL;

    setAuthState({
      user,
      member,
      isAuthenticated,
      isAdmin,
      isLoading: false,
    });
  }, [fetchMember]);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  // Refresh auth
  const refreshAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await updateAuthState(session?.user ?? null);
  }, [supabase.auth, updateAuthState]);

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await updateAuthState(session?.user ?? null);
    };
    
    initAuth();
  }, [updateAuthState, supabase.auth]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            member: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await updateAuthState(session?.user ?? null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [updateAuthState, supabase.auth]);

  const contextValue: AuthContextType = {
    ...authState,
    signOut,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Additional hooks for specific use cases
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useMember() {
  const { member } = useAuth();
  return member;
}

export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useIsAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}
