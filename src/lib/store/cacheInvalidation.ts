/**
 * Database-Driven Cache Invalidation System
 * Uses database timestamp flag to determine when to refresh store data
 */

import { useMainStore } from "./store";

// Type definitions for API responses
interface CacheInvalidationData {
  timestamp: number;
  source: string;
  type: string;
}

interface CacheStatusResponse {
  status: string;
  latestInvalidation: CacheInvalidationData | null;
  message: string;
}

interface TourCard {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  seasonId: string;
  displayName: string;
  earnings: number;
  points: number;
  win: number;
  topTen: number;
  madeCut: number;
  appearances: number;
  playoff: number;
  position: string | null;
  memberId: string;
  tourId: string;
}

interface TourCardsResponse {
  tourCards: TourCard[];
}

interface CacheRefreshResult {
  refreshed: boolean;
  reason: string;
}

interface CacheInvalidationRequest {
  source: string;
  type: string;
}

interface CacheStatus {
  lastRefresh: number | null;
  isDatabaseDriven: boolean;
}

/**
 * Check if store needs refresh based on database invalidation flag
 */
export async function checkAndRefreshIfNeeded(): Promise<CacheRefreshResult> {
  try {
    const storeState = useMainStore.getState();
    const storeTimestamp = storeState._lastUpdated ?? 0;

    // Check database invalidation flag via API
    const response = await fetch(`/api/cache/invalidate`);
    if (!response.ok) {
      return {
        refreshed: false,
        reason: `Failed to check invalidation status: ${response.status}`,
      };
    }

    //ignore eslint unsafe assignment to avoid type issues
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data: CacheStatusResponse = await response.json();
    const latestInvalidation = data.latestInvalidation;

    if (!latestInvalidation || latestInvalidation.timestamp <= storeTimestamp) {
      return {
        refreshed: false,
        reason: latestInvalidation
          ? "Store is up to date"
          : "No invalidation records found",
      };
    }

    // Refresh is needed - fetch fresh data
    const refreshed = await refreshStandingsData();

    return {
      refreshed,
      reason: refreshed
        ? `Cache refreshed: DB flag newer than store (${new Date(latestInvalidation.timestamp).toISOString()})`
        : "Cache refresh failed",
    };
  } catch (error) {
    console.error("Error checking cache invalidation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      refreshed: false,
      reason: `Error checking cache status: ${errorMessage}`,
    };
  }
}

/**
 * Refresh standings data from server
 */
export async function refreshStandingsData(): Promise<boolean> {
  try {
    const response = await fetch("/api/tourcards/current", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch tour cards: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    //ignore eslint unsafe assignment to avoid type issues
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data: TourCardsResponse = await response.json();

    if (!data.tourCards || !Array.isArray(data.tourCards)) {
      console.error("Invalid tour cards data received");
      return false;
    }

    useMainStore.setState((state) => ({
      ...state,
      tourCards: data.tourCards,
      _lastUpdated: Date.now(),
    }));

    console.log("✅ Cache refreshed successfully");
    return true;
  } catch (error) {
    console.error("Error refreshing standings data:", error);
    return false;
  }
}

/**
 * Force refresh all cached data and trigger cache invalidation flag
 */
export async function forceRefreshCache(): Promise<boolean> {
  try {
    console.log("🔄 Force refreshing cache...");

    // First trigger database invalidation flag
    const invalidationRequest: CacheInvalidationRequest = {
      source: "manual",
      type: "global",
    };

    const invalidateResponse = await fetch(`/api/cache/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidationRequest),
    });

    if (!invalidateResponse.ok) {
      console.error(
        `❌ Failed to update invalidation flag: ${invalidateResponse.status}`,
      );
      return false;
    }

    // Then refresh the data
    const success = await refreshStandingsData();

    if (success) {
      console.log("✅ Manual cache refresh completed");
    } else {
      console.error("❌ Manual cache refresh failed");
    }

    return success;
  } catch (error) {
    console.error("Error force refreshing cache:", error);
    return false;
  }
}

/**
 * Get cache status for admin panel
 */
export function getCacheStatus(): CacheStatus {
  return {
    lastRefresh: useMainStore.getState()._lastUpdated,
    isDatabaseDriven: true, // Database-driven cache invalidation
  };
}
