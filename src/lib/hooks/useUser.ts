/**
 * User Data Hook
 * 
 * Provides convenient access to current user and member information
 * with computed properties and type safety
 */

"use client";

import { useMemo } from "react";
import { useAuth } from "../auth/Auth";

export function useUser() {
  const { user, session, member, isLoading, error } = useAuth();
  
  return useMemo(() => {
    // Extract role from member data (preferred) or user metadata
    const role: string | null = member?.role ?? 
      (user?.app_metadata as Record<string, unknown> | undefined)?.role as string ?? null;
    
    // Computed display name with fallbacks
    const displayName = member?.firstname 
      ? `${member.firstname}${member.lastname ? ` ${member.lastname}` : ''}`
      : user?.email?.split('@')[0] ?? 'Anonymous';
    
    // User status checks
    const isSignedIn = !!user && !!session;
    const isMember = !!member;
    const hasProfile = isMember && !!member.firstname;
    
    return { 
      // Core data
      user, 
      session,
      member,
      
      // Status flags
      isLoading,
      isSignedIn,
      isMember,
      hasProfile,
      isAuthenticated: isSignedIn, // Alias for backward compatibility
      
      // Computed properties
      role,
      displayName,
      email: user?.email ?? null,
      
      // Error handling
      error: error ? new Error(error) : null,
      loading: isLoading, // Alias for backward compatibility
    };
  }, [user, session, member, isLoading, error]);
}
