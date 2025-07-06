/**
 * Champions Hook - Recent Tournament Winners
 * Displays champions from the most recent completed tournament
 *
 * This hook provides recent tournament champions with timing validation,
 * leveraging the seasonal store and validation utils for efficient processing.
 *
 * @module useChampions
 */

import { api } from "@/src/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { validation } from "@/lib/utils";
import { useMemo } from "react";
import type { ChampionsResult, EnhancedChampionsResult } from "@/src/lib/types";
import type {
  MinimalTour,
  MinimalTourCard,
  EnrichedTeam,
} from "@/src/lib/types";

/**
 * Returns recent tournament champions with configurable day limit
 *
 * @param daysLimit - Number of days to look back for recent champions (default: 7)
 * @returns EnhancedChampionsResult - Recent champions with comprehensive metadata and timing info
 */
export function useRecentChampions(
  daysLimit: number = 7,
): EnhancedChampionsResult {
  const { tours, allTourCards: tourCards, getTournaments } = useSeasonalStore();

  // Get most recent completed tournament
  const recentTournament = useMemo(() => {
    const completed = getTournaments(
      { status: ["completed"] },
      "endDate",
      "desc",
    );
    return completed && completed.length > 0 ? completed[0] : null;
  }, [getTournaments]);

  // Validate timing - tournament must be within the specified day limit
  const validationResult = useMemo(() => {
    if (!recentTournament) {
      return { isValid: false, error: "No recent tournaments" };
    }

    return validation.validateTournamentWindow(recentTournament, daysLimit);
  }, [recentTournament, daysLimit]);

  // Get champions data if validation passes
  const {
    data: championTeams,
    isLoading,
    error: apiError,
  } = api.team.getChampionsByTournament.useQuery(
    { tournamentId: recentTournament!.id },
    { enabled: !!recentTournament && validationResult.isValid },
  );

  return useMemo(() => {
    const now = new Date();
    const daysAgo = recentTournament
      ? Math.ceil(
          (now.getTime() - new Date(recentTournament.endDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Create enhanced timing information
    const timing = {
      daysLimit,
      daysAgo,
      isWithinLimit: validationResult.isValid,
      tournamentEndDate: recentTournament
        ? new Date(recentTournament.endDate)
        : null,
    };

    // Validation failed case
    if (!validationResult.isValid) {
      return {
        tournament: recentTournament || null,
        champs: [], // For backward compatibility
        champions: [],
        error: validationResult.error || "Tournament validation failed",
        isLoading: false,
        timing,
        stats: {
          championCount: 0,
          totalWinnings: undefined,
          averageScore: undefined,
        },
        context: {
          previousChampions: undefined,
          seasonChampions: undefined,
        },
        meta: {
          validationStatus: "expired" as const,
          cacheStatus: "miss" as const,
        },
      };
    }

    // Loading state
    if (isLoading) {
      return {
        tournament: recentTournament || null,
        champs: [], // For backward compatibility
        champions: [],
        error: null,
        isLoading: true,
        timing,
        stats: {
          championCount: 0,
          totalWinnings: undefined,
          averageScore: undefined,
        },
        context: {
          previousChampions: undefined,
          seasonChampions: undefined,
        },
        meta: {
          validationStatus: "valid" as const,
          cacheStatus: "miss" as const,
        },
      };
    }

    // Error state
    if (apiError || !championTeams) {
      return {
        tournament: recentTournament || null,
        champs: [], // For backward compatibility
        champions: [],
        error: apiError?.message || "Failed to load champions",
        isLoading: false,
        timing,
        stats: {
          championCount: 0,
          totalWinnings: undefined,
          averageScore: undefined,
        },
        context: {
          previousChampions: undefined,
          seasonChampions: undefined,
        },
        meta: {
          validationStatus: "unavailable" as const,
          cacheStatus: "miss" as const,
        },
      };
    }

    // Enrich champion teams using the same pattern as useLeaderboard
    const enrichedChampions = enrichTeamsWithTourData(
      championTeams,
      tours || [],
      tourCards || [],
    );

    // Calculate champion statistics
    const championScores = enrichedChampions
      .map((team) => parseFloat(String(team.score || "0")))
      .filter((score) => !isNaN(score) && score > 0);

    const averageScore =
      championScores.length > 0
        ? championScores.reduce((a, b) => a + b, 0) / championScores.length
        : undefined;

    const totalWinnings = enrichedChampions.reduce(
      (total, team) => total + parseFloat(String(team.tourCard?.earnings || 0)),
      0,
    );

    // Create enhanced statistics
    const stats = {
      championCount: enrichedChampions.length,
      totalWinnings: totalWinnings > 0 ? totalWinnings : undefined,
      averageScore,
    };

    // Create context (could be enhanced with historical data)
    const context = {
      previousChampions: undefined, // Could fetch previous tournament champions
      seasonChampions: undefined, // Could fetch all season champions
    };

    // Create metadata
    const meta = {
      validationStatus: "valid" as const,
      cacheStatus: "hit" as const,
    };

    return {
      tournament: recentTournament || null,
      champs: enrichedChampions, // For backward compatibility
      champions: enrichedChampions,
      error: null,
      isLoading: false,
      timing,
      stats,
      context,
      meta,
    };
  }, [
    recentTournament,
    championTeams,
    tours,
    tourCards,
    validationResult,
    isLoading,
    apiError,
    daysLimit,
  ]);
}

// ============================================================================
// TEMPORARY TEAM PROCESSING UTILITIES
// Reuses the same enrichment logic as useLeaderboard for consistency
// ============================================================================

/**
 * Enriches teams with tour and tourCard data, filtering out incomplete entries
 * This mirrors the existing logic to maintain compatibility
 */
function enrichTeamsWithTourData(
  teams: any[],
  tours: MinimalTour[],
  tourCards: MinimalTourCard[],
): EnrichedTeam[] {
  if (!teams || teams.length === 0) return [];

  return teams
    .map((team) => {
      // Find associated tour card and tour
      const tourCard = tourCards.find((card) => card.id === team.tourCardId);
      if (!tourCard) return null;

      const tour = tours.find((t) => t.id === tourCard.tourId);
      if (!tour) return null;

      return {
        ...team,
        tour,
        tourCard,
      } as EnrichedTeam;
    })
    .filter((team): team is EnrichedTeam => team !== null);
}
