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
 * Check if store needs refresh based on database invalidation flags
 * Supports separate invalidation for tour cards and tournaments
 */
export async function checkAndRefreshIfNeeded(): Promise<CacheRefreshResult> {
  try {
    const storeState = useMainStore.getState();
    const storeTimestamp = storeState._lastUpdated ?? 0;

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

    let needsTourCardRefresh = false;
    let needsTournamentRefresh = false;

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

    // Refresh needed data
    let tourCardSuccess = true;
    let tournamentSuccess = true;

    if (needsTourCardRefresh) {
      tourCardSuccess = await refreshTourCardsData();
    }

    if (needsTournamentRefresh) {
      tournamentSuccess = await refreshTournamentData();
    }

    const refreshed = tourCardSuccess && tournamentSuccess;
    const dataType =
      needsTourCardRefresh && needsTournamentRefresh
        ? "both"
        : needsTourCardRefresh
          ? "tourCards"
          : "tournaments";

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
 * Refresh tour cards data from server
 */
export async function refreshTourCardsData(): Promise<boolean> {
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

    console.log("✅ Tour cards cache refreshed successfully");
    return true;
  } catch (error) {
    console.error("Error refreshing tour cards data:", error);
    return false;
  }
}

/**
 * Refresh tournament data from server
 */
export async function refreshTournamentData(): Promise<boolean> {
  try {
    const response = await fetch("/api/tournaments/all", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
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
 * Refresh standings data from server (legacy function for compatibility)
 */
export async function refreshStandingsData(): Promise<boolean> {
  // Use the new separate refresh functions
  const tourCardSuccess = await refreshTourCardsData();
  const tournamentSuccess = await refreshTournamentData();
  return tourCardSuccess && tournamentSuccess;
}

/**
 * Force refresh specific data types and trigger cache invalidation flag
 */
export async function forceRefreshCache(
  dataType: "tourCards" | "tournaments" | "global" = "global",
): Promise<boolean> {
  try {
    console.log(`🔄 Force refreshing cache for: ${dataType}...`);

    // First trigger database invalidation flag
    const invalidationRequest: CacheInvalidationRequest = {
      source: "manual",
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

    // Then refresh the appropriate data
    let success = true;

    if (dataType === "global") {
      const tourCardSuccess = await refreshTourCardsData();
      const tournamentSuccess = await refreshTournamentData();
      success = tourCardSuccess && tournamentSuccess;
    } else if (dataType === "tourCards") {
      success = await refreshTourCardsData();
    } else if (dataType === "tournaments") {
      success = await refreshTournamentData();
    }

    if (success) {
      console.log(`✅ Manual cache refresh completed for: ${dataType}`);
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
 * Trigger tour card cache invalidation (for use by external services)
 */
export async function invalidateTourCardsCache(
  source = "api",
): Promise<boolean> {
  try {
    const response = await fetch(`/api/cache/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
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
 * Trigger tournament cache invalidation (for use by external services)
 */
export async function invalidateTournamentCache(
  source = "api",
): Promise<boolean> {
  try {
    const response = await fetch(`/api/cache/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
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
 * Get cache status for admin panel
 */
export function getCacheStatus(): CacheStatus {
  return {
    lastRefresh: useMainStore.getState()._lastUpdated,
    isDatabaseDriven: true, // Database-driven cache invalidation
    lastTourCardRefresh: useMainStore.getState()._lastUpdated, // For now, using same timestamp
    lastTournamentRefresh: useMainStore.getState()._lastUpdated, // For now, using same timestamp
  };
}
