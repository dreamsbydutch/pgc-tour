/**
 * Leaderboard Hook - Unified Tournament Leaderboard
 * Handles current and historical tournament leaderboards
 *
 * This consolidated hook provides leaderboard data with team enrichment,
 * leveraging the seasonal store and teams utils for efficient data processing.
 *
 * @module useLeaderboard
 */

import { api } from "@/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { useMemo } from "react";
import { useTournament } from "./useTournament";
import type {
  LeaderboardResult,
  EnhancedLeaderboardResult,
  MinimalTournament,
} from "@/lib/types";
import type {
  MinimalTour,
  MinimalTourCard,
  EnrichedTeam,
  TourGroup,
  TournamentStatus,
} from "@/lib/types";
import { getTournamentStatus } from "../utils/domain/golf";

/**
 * Universal leaderboard hook - works for current (live) and historical tournaments
 *
 * @param tournamentId - Optional tournament ID, defaults to current tournament
 * @returns EnhancedLeaderboardResult - Enriched leaderboard with teams, tour groups, metadata and utilities
 */
export function useLeaderboard(
  tournamentId?: string,
): EnhancedLeaderboardResult {
  const { tours, allTourCards: tourCards } = useSeasonalStore();
  const { current } = useTournament();
  const targetTournamentId = tournamentId || current?.id;

  // Get teams data
  const {
    data: rawTeams,
    isLoading,
    error,
  } = api.team.getByTournament.useQuery(
    { tournamentId: targetTournamentId! },
    { enabled: !!targetTournamentId },
  );

  // Get tournament details if not current tournament
  const { data: tournament } = api.tournament.getById.useQuery(
    { tournamentId: targetTournamentId! },
    { enabled: !!targetTournamentId && targetTournamentId !== current?.id },
  );

  return useMemo(() => {
    const now = new Date();
    const activeTournament =
      current || (tournament as unknown as MinimalTournament) || null;

    // Base case for loading state
    if (isLoading) {
      return {
        tournament: null,
        teamsByTour: [],
        totalTeams: 0,
        isLoading: true,
        error: null,
        lastUpdated: undefined,
        teams: [],
        isLive: false,
        stats: {
          totalTeams: 0,
          teamsByTour: 0,
          averageScore: undefined,
          cutLine: undefined,
        },
        utils: {
          getTeamsByTour: () => [],
          getTeamsByPosition: () => [],
          searchTeams: () => [],
        },
        meta: {
          lastUpdated: now,
          tournamentStatus: "upcoming" as TournamentStatus,
          dataFreshness: "stale" as const,
        },
      };
    }

    // Base case for error state
    if (error || !rawTeams) {
      return {
        tournament: activeTournament,
        teamsByTour: [],
        totalTeams: 0,
        isLoading: false,
        error: error?.message || "No data available",
        lastUpdated: undefined,
        teams: [],
        isLive: false,
        stats: {
          totalTeams: 0,
          teamsByTour: 0,
          averageScore: undefined,
          cutLine: undefined,
        },
        utils: {
          getTeamsByTour: () => [],
          getTeamsByPosition: () => [],
          searchTeams: () => [],
        },
        meta: {
          lastUpdated: now,
          tournamentStatus: "upcoming" as TournamentStatus,
          dataFreshness: "stale" as const,
        },
      };
    }

    // Use utils for team enrichment - this replaces the manual enrichment logic
    const enrichedTeams = enrichTeamsWithTourData(
      rawTeams,
      tours || [],
      tourCards || [],
    );

    // Group teams by tour for display
    const teamsByTour = groupTeamsByTour(enrichedTeams);

    // Calculate statistics
    const totalScores = enrichedTeams
      .map((team) => parseFloat(String(team.score || "0")))
      .filter((score) => !isNaN(score) && score > 0);

    const averageScore =
      totalScores.length > 0
        ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length
        : undefined;

    // Determine tournament status and live state
    const tournamentStatus: TournamentStatus = activeTournament
      ? (getTournamentStatus(
          new Date(activeTournament.startDate),
          new Date(activeTournament.endDate),
        ) as TournamentStatus)
      : "upcoming";

    const isLive = tournamentStatus === "current";

    // Create utility functions
    const utils = {
      getTeamsByTour: (tourId: string) =>
        enrichedTeams.filter((team) => team.tour.id === tourId),

      getTeamsByPosition: (startPos: number, endPos: number) =>
        enrichedTeams.filter((team) => {
          const pos = parseInt(team.position || "0");
          return pos >= startPos && pos <= endPos;
        }),

      searchTeams: (query: string) =>
        enrichedTeams.filter(
          (team) =>
            (team as any).name?.toLowerCase().includes(query.toLowerCase()) ||
            team.tour.name.toLowerCase().includes(query.toLowerCase()),
        ),
    };

    // Create stats
    const stats = {
      totalTeams: enrichedTeams.length,
      teamsByTour: teamsByTour.length,
      averageScore,
      cutLine: undefined, // Could be calculated based on tournament rules
    };

    // Create metadata
    const meta = {
      lastUpdated: now,
      tournamentStatus,
      dataFreshness: "fresh" as const,
    };

    return {
      tournament: activeTournament,
      teamsByTour,
      totalTeams: rawTeams.length,
      isLoading: false,
      error: null,
      lastUpdated: now,
      teams: enrichedTeams,
      isLive,
      stats,
      utils,
      meta,
    };
  }, [rawTeams, tours, tourCards, current, tournament, isLoading, error]);
}

// ============================================================================
// TEMPORARY TEAM PROCESSING UTILITIES
// These replicate the existing useTeamsHooks logic until we can fully migrate
// to the teams utils. This maintains compatibility while providing the refactor.
// ============================================================================

/**
 * Enriches teams with tour and tourCard data, filtering out incomplete entries
 * This mirrors the existing logic from useTeamsHooks.tsx
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

/**
 * Groups enriched teams by tour
 * This mirrors the existing logic from useTeamsHooks.tsx
 */
function groupTeamsByTour(enrichedTeams: EnrichedTeam[]): TourGroup[] {
  if (!enrichedTeams || enrichedTeams.length === 0) return [];

  // Group teams by tour ID
  const teamsByTourId = new Map<string, EnrichedTeam[]>();

  enrichedTeams.forEach((team) => {
    const tourId = team.tour.id;
    if (!teamsByTourId.has(tourId)) {
      teamsByTourId.set(tourId, []);
    }
    teamsByTourId.get(tourId)!.push(team);
  });

  // Convert to TourGroup array
  const tourGroups: TourGroup[] = [];

  for (const [tourId, teams] of teamsByTourId.entries()) {
    if (teams.length > 0) {
      // Sort teams by position
      const sortedTeams = teams.sort((a, b) => {
        const posA = Number(a.position) || 999;
        const posB = Number(b.position) || 999;
        return posA - posB;
      });

      tourGroups.push({
        tour: teams[0]!.tour,
        teams: sortedTeams,
        teamCount: teams.length,
      });
    }
  }

  return tourGroups;
}
