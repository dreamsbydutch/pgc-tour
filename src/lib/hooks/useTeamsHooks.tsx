import { api } from "@/src/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { useCurrentTournament, useLastTournament } from "./useTournamentHooks";
import {
  sortGolfers,
  isEmpty,
  isDefined,
  getDaysBetween,
  getTournamentStatus,
} from "@/lib/utils";

/**
 * Returns the champions of the most recent c  // Handle case where no teams exist (common for upcoming tournaments)
  if (!teams || isEmpty(teams)) {
    const noTeamsMessage = 
      tournamentStatus === "upcoming" 
        ? "No teams registered yet (tournament hasn't started)"
        : tournamentStatus === "completed"
        ? "No teams found for this tournament"
        : "No teams found for current tournament"; tournament.
 * Only returns data for 3 days after the tournament ends.
 * @returns Object containing the tournament and champion teams, or empty state if no valid data
 */
export function useLatestChampions() {
  const lastTournament = useLastTournament();
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  // Early validation - check if we have required data
  if (!isDefined(lastTournament) || isEmpty(tours) || isEmpty(tourCards)) {
    return {
      tournament: undefined,
      champs: [],
      error: "Missing required data",
    };
  }

  // Check if tournament is completed and within the 3-day window
  const now = new Date();
  const tournamentEndDate = new Date(lastTournament.endDate);
  const daysSinceEnd = getDaysBetween(tournamentEndDate, now);

  // Only show champions for 3 days after tournament ends
  if (daysSinceEnd < 0) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "Tournament not yet completed",
    };
  }

  if (daysSinceEnd > 3) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "Champion display window expired (3 days after tournament)",
    };
  }

  // Get winning teams (position 1 or T1)
  const winningTeams = lastTournament.teams.filter(
    (team) => team.position === "1" || team.position === "T1",
  );

  if (isEmpty(winningTeams)) {
    return {
      tournament: lastTournament,
      champs: [],
      error: "No champions found",
    };
  }

  // Enrich winning teams with tour and tourCard data
  const champs = winningTeams
    .map((team) => {
      const tourCard = tourCards?.find((card) => card.id === team.tourCardId);
      const tour = tours?.find((t) => t.id === tourCard?.tourId);

      // Skip teams with incomplete data
      if (!isDefined(tour) || !isDefined(tourCard)) {
        return null;
      }

      // Get and sort team golfers
      const teamGolfers = lastTournament.golfers.filter((golfer) =>
        team.golferIds.includes(golfer.apiId),
      );

      return {
        ...team,
        tour,
        tourCard,
        golfers: sortGolfers(teamGolfers),
      };
    })
    .filter(isDefined); // Remove null entries

  return {
    tournament: lastTournament,
    champs,
    error: null,
    daysRemaining: 3 - daysSinceEnd,
  };
}

/**
 * Returns the current leaderboard for an active tournament.
 * Only works when there is a current tournament in progress.
 * Refreshes teams data every 2 minutes with tour and tourCard objects included.
 * @returns Object containing the current tournament and teams grouped by tour, or empty state if no active tournament
 */
export function useCurrentLeaderboard() {
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
    };
  }

  // Check if tournament is currently active
  const tournamentStatus = getTournamentStatus(
    new Date(currentTournament.startDate),
    new Date(currentTournament.endDate),
  );

  if (tournamentStatus !== "current") {
    return {
      tournament: currentTournament,
      teamsByTour: [],
      error: `Tournament is ${tournamentStatus}, not current`,
      isLoading: false,
    };
  }

  // Validate required data
  if (isEmpty(tours) || isEmpty(tourCards)) {
    return {
      tournament: currentTournament,
      teamsByTour: [],
      error: "Missing tours or tour cards data",
      isLoading: false,
    };
  }

  // Fetch teams data with 2-minute refresh interval
  const {
    data: teams,
    isLoading,
    error: queryError,
  } = api.team.getByTournament.useQuery(
    { tournamentId: currentTournament.id },
    {
      staleTime: 1000 * 60 * 1, // Consider data stale after 1 minute
      gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
      refetchInterval: 1000 * 60 * 2, // ✅ Refetch every 2 minutes
      refetchIntervalInBackground: true, // ✅ Continue refetching when tab is not active
      refetchOnWindowFocus: true, // ✅ Refetch when user focuses the tab
      retry: 3, // Retry failed requests 3 times
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
    };
  }

  // Handle loading state
  if (isLoading || !teams) {
    return {
      tournament: currentTournament,
      teamsByTour: [],
      error: null,
      isLoading: true,
    };
  }

  // Group teams by tour with enriched data
  const teamsByTour = (tours ?? [])
    .map((tour) => {
      const tourTeams = teams
        .filter((team) => team.tourCard.tourId === tour.id)
        .map((team) => {
          const tourCard = tourCards?.find(
            (card) => card.id === team.tourCardId,
          );

          // Skip teams with missing tourCard data
          if (!isDefined(tourCard)) {
            return null;
          }

          // Get and sort team golfers
          const teamGolfers =
            currentTournament.golfers?.filter((golfer) =>
              team.golferIds.includes(golfer.apiId),
            ) ?? [];

          return {
            ...team,
            tour, // Include tour object
            tourCard, // Include tourCard object
            golfers: sortGolfers(teamGolfers),
          };
        })
        .filter(isDefined); // Remove null entries

      return {
        tour,
        teams: tourTeams,
        teamCount: tourTeams.length,
      };
    })
    .filter((tourGroup) => tourGroup.teamCount > 0); // Only include tours with teams

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
export function useTournamentLeaderboard(tournamentId: string | undefined) {
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
    };
  }

  if (tournamentError) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: `Failed to fetch tournament: ${tournamentError.message}`,
      isLoading: tournamentLoading,
      status: "error" as const,
    };
  }

  if (tournamentLoading || !tournament) {
    return {
      tournament: undefined,
      teamsByTour: [],
      error: null,
      isLoading: true,
      status: "loading" as const,
    };
  }

  // Determine tournament status
  const tournamentStatus = getTournamentStatus(
    new Date(tournament.startDate),
    new Date(tournament.endDate),
  );

  // Validate required data
  if (isEmpty(tours) || isEmpty(tourCards)) {
    return {
      tournament,
      teamsByTour: [],
      error: "Missing tours or tour cards data",
      isLoading: false,
      status: "error" as const,
      tournamentStatus,
    };
  }

  // Configure query options based on tournament status
  const isCurrentTournament = tournamentStatus === "current";

  // Fetch teams data
  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
  } = api.team.getByTournament.useQuery(
    { tournamentId: tournament.id },
    {
      enabled: true,
      retry: 3,
      ...(isCurrentTournament && {
        // For current tournaments, refresh frequently
        staleTime: 1000 * 60 * 1, // Consider data stale after 1 minute
        gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
        refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
      }),
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
    };
  }

  // Handle case where no teams exist (common for future tournaments)
  if (!teams || isEmpty(teams)) {
    const noTeamsMessage =
      tournamentStatus === "future"
        ? "No teams registered yet (tournament hasn't started)"
        : tournamentStatus === "past"
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

  // Group teams by tour with enriched data
  const teamsByTour = (tours ?? [])
    .map((tour) => {
      const tourTeams = teams
        .filter((team) => team.tourCard.tourId === tour.id)
        .map((team) => {
          const tourCard = tourCards?.find(
            (card) => card.id === team.tourCardId,
          );

          // Skip teams with missing tourCard data
          if (!isDefined(tourCard)) {
            return null;
          }

          // Get and sort team golfers
          const teamGolfers =
            tournament.golfers?.filter((golfer) =>
              team.golferIds.includes(golfer.apiId),
            ) ?? [];

          return {
            ...team,
            tour, // Include tour object
            tourCard, // Include tourCard object
            golfers: sortGolfers(teamGolfers),
          };
        })
        .filter(isDefined); // Remove null entries

      return {
        tour,
        teams: tourTeams,
        teamCount: tourTeams.length,
      };
    })
    .filter((tourGroup) => tourGroup.teamCount > 0); // Only include tours with teams

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
