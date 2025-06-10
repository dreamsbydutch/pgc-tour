/**
 * Enhanced store service for authentication integration with the new store system
 * This service manages the relationship between auth state and the new user store
 */

import type { Member } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { useUserStore } from "@/src/lib/store/domains/user/store";
import { authUtils } from "./Auth";

interface AuthStoreUpdate {
  member: Member | null;
  isAuthenticated: boolean;
}

class AuthStoreService {
  private updateCallbacks = new Set<(update: AuthStoreUpdate) => void>();

  /**
   * Register a callback for auth state changes
   */
  onAuthStateChange(callback: (update: AuthStoreUpdate) => void) {
    this.updateCallbacks.add(callback);

    return () => {
      this.updateCallbacks.delete(callback);
    };
  }
  /**
   * Update store state when authentication changes (simplified)
   */
  async updateStoreForAuth(member: Member | null, isAuthenticated: boolean) {
    // Use the new user store's auth state management
    const userStore = useUserStore.getState();
    userStore.setCurrentMember(member);
    userStore.setAuthenticated(isAuthenticated);

    // Notify subscribers
    const update: AuthStoreUpdate = { member, isAuthenticated };
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Auth callback error:", error);
        }
      }
    });
  }

  /**
   * Sync with Supabase auth state
   */
  async syncWithSupabase(supabaseUser: User | null) {
    const member: Member | null = await authUtils.syncAuthState(supabaseUser);

    // Notify subscribers
    const update: AuthStoreUpdate = {
      member,
      isAuthenticated: !!member,
    };
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Auth sync callback error:", error);
        }
      }
    });

    return member;
  }

  /**
   * Handle sign out
   */
  signOut() {
    authUtils.signOut();

    // Notify subscribers
    const update: AuthStoreUpdate = {
      member: null,
      isAuthenticated: false,
    };
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Sign out callback error:", error);
        }
      }
    });
  }
  /**
   * Refresh user data (simplified)
   */
  async refreshUserData() {
    const userStore = useUserStore.getState();
    const currentMember = userStore.currentMember;

    if (!currentMember) return;

    try {
      const response = await fetch("/api/members/current", {
        cache: "no-store",
      });

      if (response.ok) {
        const { member } = (await response.json()) as { member: Member | null };
        if (member) {
          userStore.setCurrentMember(member);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to refresh user data:", error);
      }
    }
  }

  /**
   * Check if store has valid user session
   */
  hasValidUserSession(): boolean {
    const { isAuthenticated, member } = authUtils.getAuthState();
    return !!(member && isAuthenticated);
  }
  /**
   * Update current member data
   */
  updateCurrentMember(updatedMember: Member) {
    const userStore = useUserStore.getState();
    userStore.setCurrentMember(updatedMember);

    const update: AuthStoreUpdate = {
      member: updatedMember,
      isAuthenticated: true,
    };
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Update member callback error:", error);
        }
      }
    });
  }

  /**
   * Get current authentication state
   */
  getCurrentAuthState() {
    return authUtils.getAuthState();
  }
}

// Export singleton instance
export const authStoreService = new AuthStoreService();
export type { AuthStoreUpdate };
