/**
 * Enhanced Database-Driven Cache Invalidation System
 * Integrates with centralized auth system and middleware for coordinated data management
 * Uses database timestamp flags to determine when to refresh store data
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
  latestTourCardInvalidation: CacheInvalidationData | null;
  latestTournamentInvalidation: CacheInvalidationData | null;
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

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tierId: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  logoUrl: string | null;
  seasonId: string;
  apiId: string | null;
  currentRound: number | null;
  livePlay: boolean | null;
  course: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    apiId: string;
    location: string;
    par: number;
    front: number;
    back: number;
    timeZoneOffset: number;
  } | null;
}

interface TournamentsResponse {
  tournaments: Tournament[];
}

interface CacheRefreshResult {
  refreshed: boolean;
  reason: string;
  dataType?: "tourCards" | "tournaments" | "both";
}

interface CacheInvalidationRequest {
  source: string;
  type: string;
}

interface CacheStatus {
  lastRefresh: number | null;
  isDatabaseDriven: boolean;
  lastTourCardRefresh: number | null;
  lastTournamentRefresh: number | null;
}

/**
 * Enhanced cache coordination options
 */
interface CacheCoordinationOptions {
  skipAuthCheck?: boolean;
  forceRefresh?: boolean;
  source?: string;
  respectMiddleware?: boolean;
}

/**
 * Check if store needs refresh based on database invalidation flags
 * Enhanced with auth coordination and middleware integration
 */
export async function checkAndRefreshIfNeeded(
  options: CacheCoordinationOptions = {}
): Promise<CacheRefreshResult> {
  try {
    const storeState = useMainStore.getState();
    const storeTimestamp = storeState._lastUpdated ?? 0;

    // Check auth state before proceeding with cache refresh
    if (!options.skipAuthCheck && storeState.isAuthenticated) {
      // For authenticated users, check if we need user-specific data refresh
      const authTimestamp = storeState.authLastUpdated ?? 0;
      if (authTimestamp > storeTimestamp) {
        console.log("🔄 Auth state newer than cache, coordinating refresh...");
      }
    }

    // Check middleware headers for cache hints if available
    if (options.respectMiddleware && typeof window !== 'undefined') {
      const cacheHint = getCacheHintFromHeaders();
      if (cacheHint === 'refresh-after-auth') {
        console.log("🔄 Middleware suggests cache refresh after auth");
        options.forceRefresh = true;
      }
    }

    // Check database invalidation flags via API
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

    const latestTourCardInvalidation = data.latestTourCardInvalidation;
    const latestTournamentInvalidation = data.latestTournamentInvalidation;
    const latestGlobalInvalidation = data.latestInvalidation;

    let needsTourCardRefresh = options.forceRefresh || false;
    let needsTournamentRefresh = options.forceRefresh || false;

    // Check if tour cards need refresh
    if (
      latestTourCardInvalidation &&
      latestTourCardInvalidation.timestamp > storeTimestamp
    ) {
      needsTourCardRefresh = true;
    }

    // Check if tournaments need refresh
    if (
      latestTournamentInvalidation &&
      latestTournamentInvalidation.timestamp > storeTimestamp
    ) {
      needsTournamentRefresh = true;
    }

    // Check if global invalidation requires full refresh
    if (
      latestGlobalInvalidation &&
      latestGlobalInvalidation.timestamp > storeTimestamp
    ) {
      needsTourCardRefresh = true;
      needsTournamentRefresh = true;
    }

    if (!needsTourCardRefresh && !needsTournamentRefresh) {
      return {
        refreshed: false,
        reason: "Store is up to date",
      };
    }

    // Refresh needed data with coordination
    let tourCardSuccess = true;
    let tournamentSuccess = true;

    if (needsTourCardRefresh) {
      tourCardSuccess = await refreshTourCardsData(options);
    }

    if (needsTournamentRefresh) {
      tournamentSuccess = await refreshTournamentData(options);
    }

    const refreshed = tourCardSuccess && tournamentSuccess;
    const dataType =
      needsTourCardRefresh && needsTournamentRefresh
        ? "both"
        : needsTourCardRefresh
          ? "tourCards"
          : "tournaments";

    // Update auth coordination timestamp if successful
    if (refreshed && storeState.isAuthenticated) {
      storeState.setAuthState(storeState.currentMember, true);
    }

    return {
      refreshed,
      reason: refreshed
        ? `Cache refreshed: ${dataType} updated from database flags`
        : "Cache refresh failed",
      dataType,
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
 * Get cache hint from middleware headers (client-side only)
 */
function getCacheHintFromHeaders(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check if we have middleware headers in document meta or other storage
  const metaTag = document.querySelector('meta[name="cache-hint"]');
  return metaTag?.getAttribute('content') || null;
}

/**
 * Refresh tour cards data from server with enhanced coordination
 */
export async function refreshTourCardsData(
  options: CacheCoordinationOptions = {}
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      "Cache-Control": "no-cache"
    };

    // Add source information for tracking
    if (options.source) {
      headers['X-Cache-Source'] = options.source;
    }

    const response = await fetch("/api/tourcards/current", {
      cache: "no-store",
      headers,
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

    console.log("✅ Tour cards cache refreshed successfully");
    return true;
  } catch (error) {
    console.error("Error refreshing tour cards data:", error);
    return false;
  }
}

/**
 * Refresh tournament data from server with enhanced coordination
 */
export async function refreshTournamentData(
  options: CacheCoordinationOptions = {}
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      "Cache-Control": "no-cache"
    };

    // Add source information for tracking
    if (options.source) {
      headers['X-Cache-Source'] = options.source;
    }

    const response = await fetch("/api/tournaments/all", {
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch tournaments: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    //ignore eslint unsafe assignment to avoid type issues
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data: TournamentsResponse = await response.json();

    if (!data.tournaments || !Array.isArray(data.tournaments)) {
      console.error("Invalid tournaments data received");
      return false;
    }

    // Convert to proper format with Date objects
    const processedTournaments = data.tournaments.map((tournament) => ({
      ...tournament,
      startDate: new Date(tournament.startDate),
      endDate: new Date(tournament.endDate),
      createdAt: new Date(tournament.createdAt),
      updatedAt: new Date(tournament.updatedAt),
      course: tournament.course
        ? {
            ...tournament.course,
            createdAt: new Date(tournament.course.createdAt),
            updatedAt: new Date(tournament.course.updatedAt),
          }
        : null,
    }));

    // Process tournaments to get past, current, and next
    const now = new Date();
    const tournaments = processedTournaments.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    // Find current tournament (ongoing)
    const currentTournament =
      tournaments.find(
        (t) =>
          t.startDate <= now && t.endDate >= now && (t.currentRound ?? 0) < 5,
      ) ?? null;

    // Find next tournament (upcoming)
    const nextTournament = tournaments.find((t) => t.startDate > now) ?? null;

    useMainStore.setState({
      seasonTournaments: processedTournaments,
      currentTournament,
      nextTournament,
      _lastUpdated: Date.now(),
    });

    console.log("✅ Tournament cache refreshed successfully");
    return true;
  } catch (error) {
    console.error("Error refreshing tournament data:", error);
    return false;
  }
}

/**
 * Refresh standings data from server (enhanced legacy function for compatibility)
 */
export async function refreshStandingsData(
  options: CacheCoordinationOptions = {}
): Promise<boolean> {
  // Use the new separate refresh functions with coordination
  const tourCardSuccess = await refreshTourCardsData(options);
  const tournamentSuccess = await refreshTournamentData(options);
  return tourCardSuccess && tournamentSuccess;
}

/**
 * Force refresh specific data types and trigger cache invalidation flag
 * Enhanced with auth coordination
 */
export async function forceRefreshCache(
  dataType: "tourCards" | "tournaments" | "global" = "global",
  options: CacheCoordinationOptions = {}
): Promise<boolean> {
  try {
    console.log(`🔄 Force refreshing cache for: ${dataType}...`);

    // First trigger database invalidation flag
    const invalidationRequest: CacheInvalidationRequest = {
      source: options.source || "manual",
      type: dataType,
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

    // Then refresh the appropriate data with coordination
    let success = true;
    const refreshOptions = { ...options, forceRefresh: true };

    if (dataType === "global") {
      const tourCardSuccess = await refreshTourCardsData(refreshOptions);
      const tournamentSuccess = await refreshTournamentData(refreshOptions);
      success = tourCardSuccess && tournamentSuccess;
    } else if (dataType === "tourCards") {
      success = await refreshTourCardsData(refreshOptions);
    } else if (dataType === "tournaments") {
      success = await refreshTournamentData(refreshOptions);
    }

    if (success) {
      console.log(`✅ Manual cache refresh completed for: ${dataType}`);
      
      // Update auth state coordination if user is authenticated
      const storeState = useMainStore.getState();
      if (storeState.isAuthenticated && storeState.currentMember) {
        storeState.setAuthState(storeState.currentMember, true);
      }
    } else {
      console.error(`❌ Manual cache refresh failed for: ${dataType}`);
    }

    return success;
  } catch (error) {
    console.error("Error force refreshing cache:", error);
    return false;
  }
}

/**
 * Trigger tour card cache invalidation (enhanced for auth coordination)
 */
export async function invalidateTourCardsCache(
  source = "api",
  options: CacheCoordinationOptions = {}
): Promise<boolean> {
  try {
    const response = await fetch(`/api/cache/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: options.source || source,
        type: "tourCards",
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to invalidate tour cards cache: ${response.status}`,
      );
      return false;
    }

    console.log("✅ Tour cards cache invalidation triggered");
    return true;
  } catch (error) {
    console.error("Error invalidating tour cards cache:", error);
    return false;
  }
}

/**
 * Trigger tournament cache invalidation (enhanced for auth coordination)
 */
export async function invalidateTournamentCache(
  source = "api",
  options: CacheCoordinationOptions = {}
): Promise<boolean> {
  try {
    const response = await fetch(`/api/cache/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: options.source || source,
        type: "tournaments",
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to invalidate tournament cache: ${response.status}`,
      );
      return false;
    }

    console.log("✅ Tournament cache invalidation triggered");
    return true;
  } catch (error) {
    console.error("Error invalidating tournament cache:", error);
    return false;
  }
}

/**
 * Get enhanced cache status for admin panel with auth coordination info
 */
export function getCacheStatus(): CacheStatus & { authCoordinated: boolean } {
  const storeState = useMainStore.getState();
  return {
    lastRefresh: storeState._lastUpdated,
    isDatabaseDriven: true, // Database-driven cache invalidation
    lastTourCardRefresh: storeState._lastUpdated, // For now, using same timestamp
    lastTournamentRefresh: storeState._lastUpdated, // For now, using same timestamp
    authCoordinated: storeState.isAuthenticated && !!storeState.authLastUpdated,
  };
}

/**
 * Coordinate cache refresh after authentication events
 * This function is called by the auth system when auth state changes
 */
export async function coordinateCacheAfterAuth(
  isAuthenticated: boolean,
  userId?: string
): Promise<boolean> {
  try {
    console.log("🔄 Coordinating cache after auth change:", { isAuthenticated, userId });

    if (isAuthenticated && userId) {
      // For authenticated users, do a coordinated refresh
      const options: CacheCoordinationOptions = {
        source: 'auth-coordination',
        forceRefresh: false, // Let database flags determine what needs refresh
        skipAuthCheck: false,
      };

      const result = await checkAndRefreshIfNeeded(options);
      console.log("✅ Cache coordination after auth completed:", result);
      return result.refreshed;
    } else {
      // For sign-out, we might want to clear user-specific cache
      console.log("🧹 User signed out, cache coordination complete");
      return true;
    }
  } catch (error) {
    console.error("Error coordinating cache after auth:", error);
    return false;
  }
}

/**
 * Enhanced cache refresh with middleware coordination
 * This function respects middleware hints and auth state
 */
export async function refreshWithMiddlewareCoordination(): Promise<CacheRefreshResult> {
  const options: CacheCoordinationOptions = {
    respectMiddleware: true,
    source: 'middleware-coordination',
  };

  return await checkAndRefreshIfNeeded(options);
}
