// Legacy cache invalidation functions
// This file provides backward compatibility for existing components

import { cacheManager } from "./cache";

export {
  cacheManager,
  checkAndRefreshIfNeeded,
  forceRefreshCache,
  refreshWithMiddlewareCoordination,
} from "./cache";

// Legacy function names for backward compatibility
export const refreshStandingsData = () => 
  cacheManager.checkAndRefresh({ source: "standings" });

export const refreshTourCardsData = () =>
  cacheManager.checkAndRefresh({ types: ["tourCards"] });

export const refreshTournamentData = () =>
  cacheManager.checkAndRefresh({ types: ["tournaments"] });

export const invalidateTourCardsCache = (_reason?: string) =>
  cacheManager.invalidateAndRefresh("tourCards");

export const invalidateTournamentCache = (_reason?: string) =>
  cacheManager.invalidateAndRefresh("tournaments");

export const coordinateCacheAfterAuth = async (isAuthenticated: boolean, _userId?: string) => {
  if (isAuthenticated) {
    const result = await cacheManager.checkAndRefresh({ source: "auth" });
    return result.success;
  }
  return true;
};

export const getCacheStatus = () => ({
  lastRefresh: Date.now(),
  isDatabaseDriven: true,
  lastTourCardRefresh: Date.now(),
  lastTournamentRefresh: Date.now(),
  authCoordinated: true,
  isRefreshing: false,
});
