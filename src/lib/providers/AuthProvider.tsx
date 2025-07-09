"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/auth/client";
import type { Member } from "@prisma/client";
import type { User } from "@supabase/supabase-js";

// Your custom user type from headers
export interface HeaderUser {
  id: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: HeaderUser | null;
  member: Member | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  initialUser,
  member: initialMember,
}: {
  children: ReactNode;
  initialUser?: HeaderUser | null;
  member?: Member | null;
}) {
  const [user, setUser] = useState<HeaderUser | null>(initialUser ?? null);
  const [member, setMember] = useState<Member | null>(initialMember ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Fetch member data from API
  const fetchMember = useCallback(async (userId: string): Promise<Member | null> => {
    try {
      const response = await fetch(`/api/auth/member?userId=${userId}`, {
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = await response.json() as { member: Member };
      return data.member;
    } catch {
      return null;
    }
  }, []);

  // Convert Supabase user to HeaderUser
  const convertUser = useCallback((supabaseUser: User | null): HeaderUser | null => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      avatar: supabaseUser.user_metadata?.avatar_url as string ?? undefined,
    };
  }, []);

  // Update auth state
  const updateAuthState = useCallback(async (supabaseUser: User | null) => {
    setIsLoading(true);
    
    const headerUser = convertUser(supabaseUser);
    setUser(headerUser);

    let memberData: Member | null = null;
    if (headerUser) {
      memberData = await fetchMember(headerUser.id);
    }
    setMember(memberData);
    
    setIsLoading(false);
  }, [convertUser, fetchMember]);

  // Refresh auth state manually
  const refreshAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await updateAuthState(session?.user ?? null);
  }, [supabase.auth, updateAuthState]);

  // Listen for auth changes
  useEffect(() => {
    // Initial session check (only if we don't have initial data)
    if (!initialUser) {
      const initAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await updateAuthState(session?.user ?? null);
      };
      void initAuth();
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setMember(null);
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await updateAuthState(session?.user ?? null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, updateAuthState, initialUser]);

  const value: AuthContextType = {
    user,
    member,
    isLoading,
    isAuthenticated: !!user,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to get user from auth context
export function useHeaderUser() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useHeaderUser must be used within AuthProvider");
  }
  return context;
}
