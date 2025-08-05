"use client";

/**
 * HomePageListings - Leaderboard data fetching hook
 * Simplified hook with basic tournament and team data
 */

import { api } from "@pgc-trpcClient";
import { useMember, useTours } from "@pgc-store";
import type {
  HomePageListingsLeaderboardProps,
  HomePageListingsLeaderboardTeam,
  TeamFromTournamentAPI,
} from "../utils/types";
import { useLiveTournaments } from "@pgc-hooks";

/**
 * Hook to fetch leaderboard data
 */
export const useLeaderboardData = () => {
  const member = useMember();
  const tours = useTours();
  
  // Get the current season ID safely
  const currentSeasonId = tours?.[0]?.seasonId ?? "";
  
  // Only call useLiveTournaments if we have a valid season ID
  const tournamentsResult = useLiveTournaments({
    currentSeasonId,
  });
  
  // Safely destructure with fallbacks
  const tournaments = tournamentsResult?.tournaments ?? [];

  // Fetch current active tournament
  const currentTournament = tournaments?.find(
    (t) =>
      t?.livePlay === true ||
      ((t?.currentRound ?? 0) > 1 && (t?.currentRound ?? 0) < 5),
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

  // Combined loading state - include tournaments loading
  const isLoading = 
    championsLoading || 
    teamsLoading || 
    tournamentsResult?.isLoading || 
    !tours || 
    !member ||
    !currentSeasonId;

  // Combined error state - include tournaments error
  const error = 
    championsError?.message ?? 
    teamsError?.message ?? 
    tournamentsResult?.error?.message ?? 
    null;

  // Build data object - simple transformation
  let data: HomePageListingsLeaderboardProps | null = null;

  if (tours && member && currentSeasonId) {
    try {
      // Group teams by tour
      const tourMap = new Map<string, HomePageListingsLeaderboardTeam[]>();

      if (teams && Array.isArray(teams)) {
        teams.forEach((team: TeamFromTournamentAPI) => {
          if (team?.tourCard?.tourId) {
            const tourId = team.tourCard.tourId;
            if (!tourMap.has(tourId)) {
              tourMap.set(tourId, []);
            }

            // Transform team data to match expected type
            const leaderboardTeam: HomePageListingsLeaderboardTeam = {
              id: team.id?.toString() ?? "",
              tourCard: {
                displayName: team.tourCard.displayName ?? "",
                memberId: team.tourCard.memberId ?? "",
              },
              position: team.position ?? "CUT",
              score: team.score ?? 0,
              thru: team.thru ?? 0,
            };

            tourMap.get(tourId)!.push(leaderboardTeam);
          }
        });
      }

      data = {
        tours: tours.map((t) => {
          return { ...t, teams: tourMap.get(t.id) ?? [] };
        }),
        currentTournament: currentTournament ?? undefined,
        allTournaments: tournaments ?? [],
        self: member,
        champions: champions ?? [],
      };
    } catch (err) {
      console.error("Error building leaderboard data:", err);
      // Return minimal safe data structure
      data = {
        tours: tours.map((t) => ({ ...t, teams: [] })),
        currentTournament: undefined,
        allTournaments: [],
        self: member,
        champions: [],
      };
    }
  }

  return { data, isLoading, error };
};
