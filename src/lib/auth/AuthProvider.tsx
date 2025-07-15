"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Member } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@pgc-auth";
import { api } from "@pgc-trpcClient";

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
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Get tRPC utils for member queries
  const utils = api.useUtils();

  // Fetch member data using tRPC
  const fetchMember = useCallback(
    async (userId: string): Promise<Member | null> => {
      try {
        // Use tRPC to fetch member data
        const memberData = await utils.member.getSelf.fetch();
        return memberData;
      } catch (error) {
        console.warn(`Error fetching member for userId ${userId}:`, error);
        return null;
      }
    },
    [utils.member.getSelf],
  );

  // Convert Supabase user to HeaderUser
  const convertUser = useCallback(
    (supabaseUser: User | null): HeaderUser | null => {
      if (!supabaseUser) return null;
      return {
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        avatar: (supabaseUser.user_metadata?.avatar_url as string) ?? undefined,
      };
    },
    [],
  );

  // Update auth state
  const updateAuthState = useCallback(
    async (supabaseUser: User | null) => {
      const headerUser = convertUser(supabaseUser);
      const currentUserId = headerUser?.id ?? null;

      // Skip if we're already processing the same user
      if (currentUserId === lastUserId && !isLoading) {
        return;
      }

      setIsLoading(true);
      setLastUserId(currentUserId);
      setUser(headerUser);

      let memberData: Member | null = null;
      if (headerUser) {
        try {
          memberData = await fetchMember(headerUser.id);
        } catch (error) {
          console.error("Failed to fetch member data:", error);
          memberData = null;
        }
      }
      setMember(memberData);

      setIsLoading(false);
    },
    [convertUser, fetchMember, lastUserId, isLoading],
  );

  // Refresh auth state manually
  const refreshAuth = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await updateAuthState(session?.user ?? null);
    } catch (error) {
      console.error("Failed to refresh auth:", error);
      setIsLoading(false);
    }
  }, [supabase.auth, updateAuthState]);

  // Listen for auth changes
  useEffect(() => {
    // Initial session check (only if we don't have initial data)
    if (!initialUser) {
      const initAuth = async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          await updateAuthState(session?.user ?? null);
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          setIsLoading(false);
        }
      };
      void initAuth();
    }

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setMember(null);
          setLastUserId(null);
          setIsLoading(false);
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await updateAuthState(session?.user ?? null);
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, updateAuthState, initialUser]);

  const value: AuthContextType = {
    user,
    member,
    isLoading,
    isAuthenticated: !!user,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to get user from auth context
export function useHeaderUser() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useHeaderUser must be used within AuthProvider");
  }
  return context;
}
