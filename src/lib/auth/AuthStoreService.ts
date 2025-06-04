/**
 * Enhanced store service for better authentication integration with middleware coordination
 * This service manages the relationship between auth state, store state, and cache invalidation
 */

import { useMainStore } from "@/src/lib/store/store";
import { coordinateCacheAfterAuth, refreshWithMiddlewareCoordination } from "@/src/lib/store/cacheInvalidation";
import type { Member } from "@prisma/client";

interface AuthStoreUpdate {
  member: Member | null;
  isAuthenticated: boolean;
}

class AuthStoreService {
  private updateCallbacks: Set<(update: AuthStoreUpdate) => void> = new Set();

  /**
   * Register a callback for auth state changes
   */
  onAuthStateChange(callback: (update: AuthStoreUpdate) => void) {
    this.updateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Update store state when authentication changes (enhanced with cache coordination)
   */
  async updateStoreForAuth(member: Member | null, isAuthenticated: boolean) {
    console.log("🔄 Updating store for auth state:", { 
      isAuthenticated, 
      memberEmail: member?.email 
    });

    // Update auth state in store first
    useMainStore.getState().setAuthState(member, isAuthenticated);

    // Update related user-specific data
    if (member) {
      await this.loadUserSpecificData(member);
    } else {
      this.clearUserSpecificData();
    }

    // Coordinate cache refresh after auth change
    try {
      await coordinateCacheAfterAuth(isAuthenticated, member?.id);
    } catch (error) {
      console.error("Cache coordination failed after auth change:", error);
    }

    // Notify subscribers
    const update: AuthStoreUpdate = { member, isAuthenticated };
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error("Error in auth state change callback:", error);
      }
    });
  }

  /**
   * Load user-specific data when authenticated
   */
  private async loadUserSpecificData(member: Member) {
    try {
      console.log("📡 Loading user-specific data for:", member.email);
      
      const store = useMainStore.getState();
      
      // Load tour cards and find user's current tour card
      const tourCardsResponse = await fetch("/api/tourcards/current");
      if (tourCardsResponse.ok) {
        const { tourCards } = await tourCardsResponse.json();
        const currentTourCard = tourCards?.find((tc: any) => tc.memberId === member.id) ?? null;
        
        // Load tour data if user has a tour card
        if (currentTourCard) {
          const toursResponse = await fetch("/api/tours/all");
          if (toursResponse.ok) {
            const { tours } = await toursResponse.json();
            const currentTour = tours?.find((t: any) => t.id === currentTourCard.tourId) ?? null;
            
            // Update store with user-specific data
            store.batchUpdate({
              currentTourCard,
              currentTour,
              tourCards,
              tours,
            });
          }
        }
      }
      
      console.log("✅ User-specific data loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load user-specific data:", error);
    }
  }

  /**
   * Clear user-specific data when signed out with enhanced coordination
   */
  private clearUserSpecificData() {
    console.log("🧹 Clearing user-specific data from store");
    
    const store = useMainStore.getState();
    
    // Use clearAuthState instead of manual clearing
    store.clearAuthState();
    
    // Also clear related user data
    store.batchUpdate({
      currentTourCard: null,
      currentTour: null,
    });
  }

  /**
   * Force refresh of user data with cache coordination (useful for profile updates)
   */
  async refreshUserData() {
    const store = useMainStore.getState();
    const currentMember = store.currentMember;
    
    if (!currentMember) {
      console.log("No current member to refresh");
      return;
    }

    try {
      console.log("🔄 Refreshing user data with cache coordination...");
      
      // First check if middleware suggests a refresh
      const middlewareResult = await refreshWithMiddlewareCoordination();
      console.log("Middleware coordination result:", middlewareResult);

      // Refetch member data
      const memberResponse = await fetch("/api/members/current", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      
      if (memberResponse.ok) {
        const { member } = await memberResponse.json();
        if (member) {
          // Update auth state with refreshed member data
          store.setAuthState(member, true);
          await this.loadUserSpecificData(member);
          console.log("✅ User data refreshed successfully");
        }
      }
    } catch (error) {
      console.error("❌ Failed to refresh user data:", error);
    }
  }

  /**
   * Check if store has valid user session data with auth coordination
   */
  hasValidUserSession(): boolean {
    const store = useMainStore.getState();
    return !!(store.currentMember && store.isAuthenticated && store.authLastUpdated);
  }

  /**
   * Update the current member data in both store and trigger auth context refresh
   * Enhanced with proper auth state coordination
   */
  updateCurrentMember(updatedMember: Member) {
    console.log("🔄 Updating current member:", updatedMember.email);
    
    // Update auth state with new member data
    useMainStore.getState().setAuthState(updatedMember, true);
    
    // Notify subscribers of the change
    const update: AuthStoreUpdate = { 
      member: updatedMember, 
      isAuthenticated: true 
    };
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error("Error in auth state change callback:", error);
      }
    });
  }

  /**
   * Get current authentication state from store with enhanced coordination info
   */
  getCurrentAuthState() {
    const store = useMainStore.getState();
    return {
      member: store.currentMember,
      tourCard: store.currentTourCard,
      tour: store.currentTour,
      isAuthenticated: store.isAuthenticated,
      authLastUpdated: store.authLastUpdated,
      lastUpdated: store._lastUpdated,
    };
  }

  /**
   * Handle middleware cache hints for coordinated refreshes
   */
  async handleMiddlewareCacheHint(hint: string) {
    console.log("🔄 Handling middleware cache hint:", hint);
    
    switch (hint) {
      case 'refresh-after-auth':
        await this.refreshUserData();
        break;
      case 'auth-required':
        // Auth context will handle this
        console.log("Auth required, letting AuthContext handle");
        break;
      case 'auth-error':
        console.warn("Auth error detected by middleware");
        break;
      default:
        console.log("Unknown cache hint:", hint);
    }
  }
}

// Export singleton instance
export const authStoreService = new AuthStoreService();

// Export type for external use
export type { AuthStoreUpdate };
