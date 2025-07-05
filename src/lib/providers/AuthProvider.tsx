"use client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createContext, useContext, ReactNode } from "react";
import { createClient } from "../supabase/client";
import type { Member } from "@prisma/client";

const supabase = createClient();

// Your custom user type from headers
interface HeaderUser {
  id: string;
  email: string;
  avatar?: string;
}

interface CustomAuthContextType {
  user: HeaderUser | null;
  member: Member | null;
}

const CustomAuthContext = createContext<CustomAuthContextType | null>(null);

export function AuthProvider({
  children,
  initialUser,
  member,
}: {
  children: ReactNode;
  initialUser?: HeaderUser | null;
  member?: Member | null;
}) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <CustomAuthContext.Provider
        value={{ user: initialUser ?? null, member: member ?? null }}
      >
        {children}
      </CustomAuthContext.Provider>
    </SessionContextProvider>
  );
}

// Hook to get user from headers (fast, no API calls)
export function useHeaderUser() {
  const context = useContext(CustomAuthContext);
  if (!context) {
    throw new Error("useHeaderUser must be used within AuthProvider");
  }
  return context;
}
