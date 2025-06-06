/**
 * Simplified User Hook
 * 
 * Streamlined hook that integrates with the new auth system
 * Use useAuth from Auth.tsx instead for full functionality
 */

"use client";

import { useAuth } from "../auth/Auth";

// Legacy hook for backward compatibility
export function useUser() {
  const { user, session, member, isLoading, error } = useAuth();
  
  // Extract role from member data (preferred) or user metadata
  const role: string | null = member?.role ?? (user?.app_metadata as Record<string, unknown> | undefined)?.role as string ?? null;
  
  return { 
    loading: isLoading, 
    error: error ? new Error(error) : null, 
    session, 
    user, 
    role,
    // Additional fields for compatibility
    member,
    isAuthenticated: !!user && !!session,
  };
}
