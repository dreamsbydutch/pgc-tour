"use client";

/**
 * HomePageListings - Leaderboard data fetching hook
 * Simplified hook with basic tournament and team data
 */

import { api } from "@pgc-trpcClient";
import { useMember, useTournaments, useTours } from "@pgc-store";
import type {
  HomePageListingsLeaderboardProps,
  HomePageListingsLeaderboardTeam,
  HomePageListingsLeaderboardTour,
  TeamFromTournamentAPI,
  TourFromStore,
} from "../utils/types";

/**
 * Hook to fetch leaderboard data
 */
export const useLeaderboardData = () => {
  const member = useMember();
  const tours = useTours();
  const tournaments = useTournaments();

  // Fetch current active tournament
  const currentTournament = tournaments?.find(
    (t) =>
      t.livePlay || ((t.currentRound ?? 0) > 1 && (t.currentRound ?? 0) === 5),
  );

  // Fetch teams for the current tournament
  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
  } = api.team.getByTournament.useQuery(
    { tournamentId: currentTournament?.id ?? "" },
    {
      enabled: !!currentTournament?.id,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  );

  const {
    data: champions,
    isLoading: championsLoading,
    error: championsError,
  } = api.team.getAllChampions.useQuery();

  // Combined loading state
  const isLoading = championsLoading || teamsLoading || !tours || !member;

  // Combined error state
  const error = championsError?.message || teamsError?.message || null;

  // Build data object - simple transformation
  let data: HomePageListingsLeaderboardProps | null = null;

  if (tours && member) {
    // Group teams by tour
    const tourMap = new Map<string, HomePageListingsLeaderboardTeam[]>();

    if (teams) {
      teams.forEach((team: TeamFromTournamentAPI) => {
        if (team.tourCard?.tourId) {
          const tourId = team.tourCard.tourId;
          if (!tourMap.has(tourId)) {
            tourMap.set(tourId, []);
          }

          // Transform team data to match expected type
          const leaderboardTeam: HomePageListingsLeaderboardTeam = {
            id: team.id.toString(),
            tourCard: {
              displayName: team.tourCard.displayName,
              memberId: team.tourCard.memberId,
            },
            position: team.position || "CUT",
            score: team.score || 0,
            thru: team.thru || 0,
          };

          tourMap.get(tourId)!.push(leaderboardTeam);
        }
      });
    }

    // Transform tours data to match expected type
    const transformedTours: HomePageListingsLeaderboardTour[] = tours.map(
      (tour: TourFromStore) => ({
        id: tour.id,
        seasonId: currentTournament?.seasonId ?? "default-season", // Use fallback if no current tournament
        logoUrl: tour.logoUrl,
        shortForm: tour.shortForm,
        teams: tourMap.get(tour.id) || [],
      }),
    );

    data = {
      tours: tours.map((t) => {
        return { ...t, teams: tourMap.get(t.id) || [] };
      }),
      currentTournament,
      allTournaments: tournaments || [],
      self: member,
      champions: champions,
    };
  }

  return { data, isLoading, error };
};
