/**
 * Database-Driven Cache Invalidation System
 * Uses database timestamp flag to determine when to refresh store data
 */

import { useMainStore } from "./store";

/**
 * Check if store needs refresh based on database invalidation flag
 */
export async function checkAndRefreshIfNeeded(): Promise<{
  refreshed: boolean;
  reason: string;
}> {
  try {
    const storeState = useMainStore.getState();
    const storeTimestamp = storeState._lastUpdated ?? 0;

    // Check database invalidation flag via API
    const response = await fetch(`/api/cache/invalidate`);
    if (!response.ok) {
      return {
        refreshed: false,
        reason: "Failed to check invalidation status",
      };
    }

    const data = await response.json();
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
    return { refreshed: false, reason: "Error checking cache status" };
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

    if (!response.ok) return false;

    const data = (await response.json()) as { tourCards: any[] };
    if (!data.tourCards) return false;

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
    const invalidateResponse = await fetch(`/api/cache/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "manual",
        type: "global",
      }),
    });

    if (!invalidateResponse.ok) {
      console.error("❌ Failed to update invalidation flag");
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
export function getCacheStatus() {
  return {
    lastRefresh: useMainStore.getState()._lastUpdated,
    isDatabaseDriven: true, // Database-driven cache invalidation
  };
}
