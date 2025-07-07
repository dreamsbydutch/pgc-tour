/**
 * Champions Hook - Recent Tournament Winners
 * Displays champions from the most recent completed tournament
 *
 * This hook provides recent tournament champions with timing validation,
 * leveraging the seasonal store and validation utils for efficient processing.
 *
 * @module useChampions
 */

import { api } from "@/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { validation } from "@/lib/utils";
import { useMemo } from "react";
import type {
  ChampionsResult,
  EnhancedChampionsResult,
  MinimalTour,
  MinimalTourCard,
  EnrichedTeam,
} from "@/lib/types";

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
    return completed?.[0] ?? null;
  }, [getTournaments]);

  // Validate timing - tournament must be within the specified day limit
  const validationResult = useMemo(() => {
    if (!recentTournament)
      return { isValid: false, error: "No recent tournaments" };
    return validation.validateTournamentWindow(recentTournament, daysLimit);
  }, [recentTournament, daysLimit]);

  // Get champions data if validation passes
  const {
    data: championTeams,
    isLoading,
    error: apiError,
  } = api.team.getChampionsByTournament.useQuery(
    { tournamentId: recentTournament?.id ?? "" },
    { enabled: !!recentTournament && validationResult.isValid },
  );

  // Helper to ensure tournament has required 'season' property for type compatibility
  function withSeasonProp(t: any): MinimalTour | null {
    if (!t) return null;
    if ("season" in t) return t;
    return { ...t, season: undefined } as MinimalTour;
  }

  // Memoize the result for performance
  return useMemo(() => {
    const now = new Date();
    const daysAgo = recentTournament
      ? Math.ceil(
          (now.getTime() - new Date(recentTournament.endDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    const timing = {
      daysLimit,
      daysAgo,
      isWithinLimit: validationResult.isValid,
      tournamentEndDate: recentTournament
        ? new Date(recentTournament.endDate)
        : null,
    };

    // Helper to build the result object
    const buildResult = (overrides: Partial<EnhancedChampionsResult>) => ({
      tournament: withSeasonProp(recentTournament),
      champs: [],
      champions: [],
      error: null,
      isLoading: false,
      timing,
      stats: {
        championCount: 0,
        totalWinnings: undefined,
        averageScore: undefined,
      },
      context: { previousChampions: undefined, seasonChampions: undefined },
      meta: {
        validationStatus: "valid" as const,
        cacheStatus: "miss" as const,
      },
      ...overrides,
    });

    if (!validationResult.isValid) {
      return buildResult({
        error: validationResult.error || "Tournament validation failed",
        meta: {
          validationStatus: "expired" as const,
          cacheStatus: "miss" as const,
        },
      });
    }
    if (isLoading) {
      return buildResult({ isLoading: true });
    }
    if (apiError || !championTeams) {
      return buildResult({
        error: apiError?.message || "Failed to load champions",
        meta: {
          validationStatus: "unavailable" as const,
          cacheStatus: "miss" as const,
        },
      });
    }

    // Enrich champion teams using the same pattern as useLeaderboard
    const enrichedChampions = enrichTeamsWithTourData(
      championTeams,
      tours || [],
      tourCards || [],
    );
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
    return {
      tournament: withSeasonProp(recentTournament),
      champs: enrichedChampions,
      champions: enrichedChampions,
      error: null,
      isLoading: false,
      timing,
      stats: {
        championCount: enrichedChampions.length,
        totalWinnings: totalWinnings > 0 ? totalWinnings : undefined,
        averageScore,
      },
      context: {
        previousChampions: undefined,
        seasonChampions: undefined,
      },
      meta: {
        validationStatus: "valid" as const,
        cacheStatus: "hit" as const,
      },
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
// ============================================================================

function enrichTeamsWithTourData(
  teams: any[],
  tours: MinimalTour[],
  tourCards: MinimalTourCard[],
): EnrichedTeam[] {
  if (!teams?.length) return [];
  return teams
    .map((team) => {
      const tourCard = tourCards.find((card) => card.id === team.tourCardId);
      if (!tourCard) return null;
      const tour = tours.find((t) => t.id === tourCard.tourId);
      if (!tour) return null;
      return { ...team, tour, tourCard } as EnrichedTeam;
    })
    .filter((team): team is EnrichedTeam => team !== null);
}
