/**
 * Tournament Hook - Single Source of Truth
 * Provides all tournament navigation and data needs
 *
 * This consolidated hook replaces multiple individual hooks with a single,
 * store-first approach that leverages the seasonal store's filtering capabilities.
 *
 * @module useTournament
 */

import { useSeasonalStore } from "../store/seasonalStore";
import { useMemo } from "react";
import type { MinimalTournament } from "@/src/lib/types";
import type {
  TournamentHookResult,
  EnhancedTournamentHookResult,
} from "@/src/lib/types";
import { tournaments } from "../utils/domain/tournaments";
import { getTournamentStatus } from "../utils/domain/golf";

/**
 * Consolidated tournament hook providing all tournament navigation needs
 *
 * Uses the seasonal store's getTournaments selector with status-based filtering
 * to provide current, next, previous, upcoming, and completed tournaments.
 *
 * @returns EnhancedTournamentHookResult - Complete tournament navigation data with metadata and utilities
 */
export function useTournament(): EnhancedTournamentHookResult {
  const {
    season,
    tournaments: storeTournaments,
    getTournaments,
  } = useSeasonalStore();

  return useMemo(() => {
    const tournaments = storeTournaments || [];
    const now = new Date();

    // Use store selectors for filtered data - leverages existing getTournaments logic
    const currentArray = getTournaments({ status: ["current"] }) || [];
    const current: MinimalTournament | null =
      currentArray.length > 0 ? currentArray[0]! : null;

    const upcoming =
      getTournaments({ status: ["upcoming"] }, "startDate", "asc") || [];

    const completed =
      getTournaments({ status: ["completed"] }, "endDate", "desc") || [];

    const next: MinimalTournament | null =
      upcoming.length > 0 ? upcoming[0]! : null;
    const previous: MinimalTournament | null =
      completed.length > 0 ? completed[0]! : null;

    // Calculate statistics
    const stats = {
      total: tournaments.length,
      currentCount: currentArray.length,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
    };

    // Create utility functions
    const utils = {
      isLive: (tournament: MinimalTournament) => {
        const status = getTournamentStatus(
          new Date(tournament.startDate),
          new Date(tournament.endDate),
        );
        return status === "current";
      },
      getByStatus: (status: "upcoming" | "current" | "completed") => {
        return getTournaments({ status: [status] }) || [];
      },
      sortBy: (
        field: keyof MinimalTournament,
        direction: "asc" | "desc" = "asc",
      ) => {
        const sorted = [...tournaments].sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];

          // Handle null/undefined values
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return direction === "asc" ? 1 : -1;
          if (bVal == null) return direction === "asc" ? -1 : 1;

          if (aVal < bVal) return direction === "asc" ? -1 : 1;
          if (aVal > bVal) return direction === "asc" ? 1 : -1;
          return 0;
        });
        return sorted;
      },
    };

    // Create metadata
    const meta = {
      lastUpdated: now,
      dataSource: "store" as const,
      cacheHit: !!tournaments.length,
    };

    return {
      current,
      next,
      previous,
      upcoming,
      completed,
      all: tournaments,
      season,
      isLoading: !tournaments, // Store-based loading state
      error: null,
      stats,
      utils,
      meta,
    };
  }, [storeTournaments, getTournaments, season]);
}

/**
 * Get tournament history for a specific season
 *
 * Uses store data for current season, could be extended to use API for historical seasons.
 *
 * @param seasonId - Optional season ID, defaults to current season
 * @returns MinimalTournament[] - Array of tournaments for the specified season
 */
export function useTournamentHistory(seasonId?: string): MinimalTournament[] {
  const { getTournaments, season } = useSeasonalStore();

  return useMemo(() => {
    // For now, only support current season from store
    // Future: add API call for historical seasons
    if (seasonId && seasonId !== season?.id) {
      console.warn(
        `Historical season data not yet supported for season ${seasonId}`,
      );
      return [];
    }

    // Get all tournaments for current season, sorted by date (newest first)
    return getTournaments(undefined, "startDate", "desc");
  }, [getTournaments, seasonId, season?.id]);
}
