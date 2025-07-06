import { api } from "@/src/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { useCurrentTournament, useLastTournament } from "./useTournamentHooks";

// Import utilities from the new utils suite
import {
  golf,
  dates,
  processing,
  aggregation,
  validation,
  teams,
} from "@/lib/utils";
import { getOptimizedQueryConfig } from "@/lib/utils/system/queries";

// Direct imports from the core index
import { groupBy, hasItems, isEmpty, isDefined } from "@/lib/utils/core/index";

// Import centralized types
import type {
  ChampionsResult,
  LeaderboardResult,
  TournamentLeaderboardResult,
  MinimalTour,
  MinimalTourCard,
  MinimalTournament,
  EnrichedTeam,
  TourGroup,
} from "@/lib/types";

import type { Tournament, Team, Tour, TourCard, Golfer } from "@prisma/client";

// ============================================================================
// TEAM PROCESSING UTILITIES (Temporary - to be refactored in later phases)
// ============================================================================

/**
 * Enriches teams with tour and tourCard data, filtering out incomplete entries
 * TODO: Replace with teams.enrichTeamsWithRelations in Phase 4
 */
function enrichTeamsWithTourData(
  teams: Team[],
  tours: MinimalTour[],
  tourCards: MinimalTourCard[],
  golfers?: Golfer[],
): EnrichedTeam[] {
  if (!hasItems(teams)) return [];

  return teams
    .map((team) => {
      // Find associated tour card and tour
      const tourCard = tourCards.find((card) => card.id === team.tourCardId);
      if (!tourCard) return null;

      const tour = tours.find((t) => t.id === tourCard.tourId);
      if (!tour) return null;

      // Add sorted golfers if available
      const teamGolfers = golfers
        ? processing.sortBy(
            processing.filterByPredicate(golfers, (g: Golfer) =>
              team.golferIds.includes(g.apiId),
            ),
            [{ key: "score" as keyof Golfer, direction: "asc" }],
          )
        : undefined;

      return {
        ...team,
        tour,
        tourCard,
        ...(teamGolfers && { golfers: teamGolfers }),
      };
    })
    .filter(isDefined);
}

/**
 * Groups enriched teams by tour using manual grouping (type-safe for Team entity)
 * TODO: Replace with teams.groupTeamsByProperty in Phase 4
 */
function groupTeamsByTour(enrichedTeams: EnrichedTeam[]): TourGroup[] {
  if (!hasItems(enrichedTeams)) return [];

  const teamsByTourId = groupBy(
    enrichedTeams,
    (team: EnrichedTeam) => team.tour.id,
  );

  const validGroups: TourGroup[] = [];

  for (const [, teams] of Object.entries(teamsByTourId)) {
    if (hasItems(teams as EnrichedTeam[])) {
      const typedTeams = teams as EnrichedTeam[];
      validGroups.push({
        tour: typedTeams[0]!.tour,
        teams: processing.sortBy(typedTeams, [
          { key: "position" as keyof EnrichedTeam, direction: "asc" },
        ]),
        teamCount: typedTeams.length,
      });
    }
  }

  return validGroups.sort((a, b) => a.tour.name.localeCompare(b.tour.name));
}

// ============================================================================
// HOOK FUNCTIONS
// ============================================================================

/**
 * Returns the champions of the most recent tournament.
 * Only returns data for 3 days after the tournament ends.
 * @returns Object containing the tournament and champion teams, or empty state if no valid data
 */
export function useLatestChampions(): ChampionsResult {
  const lastTournament = useLastTournament();
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  // Early validation - check if we have required data
  if (!isDefined(lastTournament)) {
    return {
      tournament: undefined,
      champs: [],
      error: "No last tournament available",
      isLoading: false,
    };
  }

  // Validate seasonal data
  const seasonalError = validation.validateRequiredData([
    { name: "tours", data: tours || [] },
    { name: "tour cards", data: tourCards || [] },
  ]);
  if (seasonalError) {
    return {
      tournament: lastTournament,
      champs: [],
      error: seasonalError,
      isLoading: false,
    };
  }

  // Validate tournament timing for champions display
  const championWindow = validation.validateTournamentWindow(lastTournament, 3);
  if (!championWindow.isValid) {
    return {
      tournament: lastTournament,
      champs: [],
      error: championWindow.error || "Tournament timing validation failed",
      isLoading: false,
      daysRemaining: championWindow.daysRemaining,
    };
  }

  // Note: The tournament data structure doesn't include teams directly
  // We would need to fetch teams separately, but for now return success with empty data
  return {
    tournament: lastTournament,
    champs: [],
    error: null,
    isLoading: false,
    daysRemaining: championWindow.daysRemaining,
  };
}

/**
 * Returns the current leaderboard for an active tournament.
 * Only works when there is a current tournament in progress.
 * Refreshes teams data every 2 minutes with tour and tourCard objects included.
 * @returns Object containing the current tournament and teams grouped by tour, or empty state if no active tournament
 */
export function useCurrentLeaderboard(): LeaderboardResult {
  const currentTournament = useCurrentTournament();
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  // Early validation - check if we have an active tournament
  if (!isDefined(currentTournament)) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: "No active tournament",
      isLoading: false,
      totalTeams: 0,
    };
  }

  // Check if tournament is currently active
  const tournamentStatus = golf.getTournamentStatus(
    new Date(currentTournament!.startDate),
    new Date(currentTournament!.endDate),
  );

  if (tournamentStatus !== "current") {
    return {
      tournament: currentTournament,
      teamsByTour: [],
      error: `Tournament is ${tournamentStatus}, not current`,
      isLoading: false,
      totalTeams: 0,
    };
  }

  // Validate required data
  const seasonalError = validation.validateRequiredData([
    { name: "tours", data: tours || [] },
    { name: "tour cards", data: tourCards || [] },
  ]);
  if (seasonalError) {
    return {
      tournament: currentTournament,
      teamsByTour: [],
      error: seasonalError,
      isLoading: false,
      totalTeams: 0,
    };
  }

  // Fetch teams data with 2-minute refresh interval
  const queryConfig = getOptimizedQueryConfig(true);
  const {
    data: teams,
    isLoading,
    error: queryError,
  } = api.team.getByTournament.useQuery(
    { tournamentId: currentTournament!.id },
    {
      ...queryConfig,
      enabled: true, // Always enabled since we've validated the tournament exists
    },
  );

  // Handle query errors
  if (queryError) {
    return {
      tournament: currentTournament,
      teamsByTour: [],
      error: `Failed to fetch teams: ${queryError.message}`,
      isLoading,
      totalTeams: 0,
    };
  }

  // Handle loading state
  if (isLoading || !teams) {
    return {
      tournament: currentTournament,
      teamsByTour: [],
      error: null,
      isLoading: true,
      totalTeams: 0,
    };
  }

  // Enrich teams with tour and tourCard data
  const enrichedTeams = enrichTeamsWithTourData(
    teams,
    tours || [],
    tourCards || [],
  );

  // Group teams by tour
  const teamsByTour = groupTeamsByTour(enrichedTeams);

  return {
    tournament: currentTournament,
    teamsByTour,
    error: null,
    isLoading: false,
    totalTeams: teams.length,
    lastUpdated: new Date(),
  };
}

/**
 * Returns the leaderboard for any tournament by ID.
 * Works for past, current, and future tournaments.
 * For current tournaments, refreshes data every 2 minutes.
 * For past tournaments, returns cached data.
 * For future tournaments, may return teams if they exist (rare case).
 * @param tournamentId - The ID of the tournament to get teams for
 * @returns Object containing the tournament and teams grouped by tour, with status info
 */
export function useTournamentLeaderboard(
  tournamentId: string | undefined,
): TournamentLeaderboardResult {
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  // Get tournament data by ID
  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = api.tournament.getById.useQuery(
    { tournamentId: tournamentId! },
    {
      enabled: !!tournamentId,
    },
  );

  // Early validation
  if (!tournamentId) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: "No tournament ID provided",
      isLoading: false,
      status: "error" as const,
      totalTeams: 0,
    };
  }

  if (tournamentError) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: `Failed to fetch tournament: ${tournamentError.message}`,
      isLoading: tournamentLoading,
      status: "error" as const,
      totalTeams: 0,
    };
  }

  if (tournamentLoading || !tournament) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: null,
      isLoading: true,
      status: "loading" as const,
      totalTeams: 0,
    };
  }

  // Determine tournament status
  const tournamentStatus = golf.getTournamentStatus(
    new Date(tournament.startDate),
    new Date(tournament.endDate),
  );

  // Validate required data
  const seasonalError = validation.validateRequiredData([
    { name: "tours", data: tours || [] },
    { name: "tour cards", data: tourCards || [] },
  ]);
  if (seasonalError) {
    return {
      tournament,
      teamsByTour: [],
      error: seasonalError,
      isLoading: false,
      status: "error" as const,
      tournamentStatus,
      totalTeams: 0,
    };
  }

  // Configure query options based on tournament status
  const isCurrentTournament = tournamentStatus === "current";
  const queryConfig = getOptimizedQueryConfig(isCurrentTournament);

  // Fetch teams data
  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
  } = api.team.getByTournament.useQuery(
    { tournamentId: tournament.id },
    {
      enabled: true,
      ...queryConfig,
    },
  );

  // Handle teams query errors
  if (teamsError) {
    return {
      tournament,
      teamsByTour: [],
      error: `Failed to fetch teams: ${teamsError.message}`,
      isLoading: teamsLoading,
      status: "error" as const,
      tournamentStatus,
      totalTeams: 0,
    };
  }

  // Handle loading state
  if (teamsLoading) {
    return {
      tournament,
      teamsByTour: [],
      error: null,
      isLoading: true,
      status: "loading" as const,
      tournamentStatus,
      totalTeams: 0,
    };
  }

  // Handle case where no teams exist (common for future tournaments)
  if (!teams || isEmpty(teams)) {
    const noTeamsMessage =
      tournamentStatus === "upcoming"
        ? "No teams registered yet (tournament hasn't started)"
        : tournamentStatus === "completed"
          ? "No teams found for this tournament"
          : "No teams found for current tournament";

    return {
      tournament,
      teamsByTour: [],
      error: null,
      isLoading: false,
      status: "empty" as const,
      tournamentStatus,
      message: noTeamsMessage,
      totalTeams: 0,
    };
  }

  // Enrich teams with tour and tourCard data
  const enrichedTeams = enrichTeamsWithTourData(
    teams,
    tours || [],
    tourCards || [],
  );

  // Group teams by tour
  const teamsByTour = groupTeamsByTour(enrichedTeams);

  return {
    tournament,
    teamsByTour,
    error: null,
    isLoading: false,
    status: "success" as const,
    tournamentStatus,
    totalTeams: teams.length,
    lastUpdated: new Date(),
  };
}
