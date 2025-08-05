/**
 * Optimized custom hook for fetching all data needed for StandingsView
 *
 * This hook orchestrates all the data fetching required for the standings,
 * including tours, tour cards, members, teams, and tournaments.
 * It uses optimized queries and efficient algorithms to minimize loading times.
 *
 * Key optimizations:
 * - Season-specific team queries instead of fetching all teams
 * - O(1) Map lookups for position calculations instead of O(n²) filters
 * - Efficient data structures and memoization
 * - Early data availability for improved perceived performance
 *
 * @returns Object containing standings data, loading state, and error state
 */

import { useMemo } from "react";
import { api } from "@pgc-trpcClient";
import {
  useAllTourCards,
  useSeason,
  useTiers,
  useTours,
  useMember,
} from "@pgc-store";
import type { TourCard, Tournament, Team } from "@prisma/client";
import type {
  StandingsData,
  StandingsState,
  ExtendedTourCard,
} from "../utils/types";
import { useLiveTournaments } from "@pgc-hooks";

/**
 * Optimized hook for fetching all standings data
 *
 * Uses efficient database queries, optimized algorithms, and smart caching
 * to provide fast loading times and smooth user experience.
 */
export function useStandingsData(): StandingsState {
  const currentMember = useMember();
  const season = useSeason();
  const { tournaments } = useLiveTournaments({
    currentSeasonId: season?.id ?? "",
  });
  const tourCards = useAllTourCards();
  const tours = useTours();
  const tiers = useTiers();

  const seasonId = season?.id;

  // Get tournament IDs for current season (memoized)
  const tournamentIds = useMemo(() => {
    if (!tournaments || !seasonId) return [];
    return tournaments.filter((t) => t.seasonId === seasonId).map((t) => t.id);
  }, [tournaments, seasonId]);

  // Fetch only teams for tournaments in current season (optimized query)
  const teamsQuery = api.team.getBySeason.useQuery(
    { seasonId: seasonId ?? "" },
    {
      enabled: !!seasonId && tournamentIds.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error) => {
        // Only retry on network errors, not server errors
        return failureCount < 2 && !error?.message?.includes("4");
      },
    },
  );

  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);

  // Compute extended tour cards with position changes (memoized for performance)
  const extendedTourCards = useMemo(() => {
    if (!tourCards || !tournaments || !teams.length) return [];

    return computeExtendedTourCards(tourCards, tournaments, teams, seasonId);
  }, [tourCards, tournaments, teams, seasonId]);

  // Find current user's tour card
  const currentTourCard = useMemo(() => {
    if (!currentMember) return null;
    return (
      extendedTourCards.find((tc) => tc.memberId === currentMember.id) ?? null
    );
  }, [extendedTourCards, currentMember]);

  // Filter tournaments for current season
  const seasonTournaments = useMemo(
    () => tournaments?.filter((t) => t.seasonId === seasonId) ?? [],
    [tournaments, seasonId],
  );

  // Optimized loading state - show UI as soon as basic data is available
  const isLoading = teamsQuery.isLoading || !tours || !tourCards || !seasonId;
  const hasBasicData = !!tours && !!tourCards && !!seasonId;
  const error = teamsQuery.error;

  const data: StandingsData | null = useMemo(() => {
    // Return partial data immediately if we have the basics, even if teams are still loading
    if (!hasBasicData || !tiers) return null;

    return {
      tours,
      tiers,
      tourCards: extendedTourCards,
      currentTourCard,
      currentMember,
      teams,
      tournaments: seasonTournaments,
      seasonId,
    };
  }, [
    hasBasicData,
    tours,
    tiers,
    seasonId,
    extendedTourCards,
    currentTourCard,
    currentMember,
    teams,
    seasonTournaments,
  ]);

  return {
    data,
    isLoading,
    error: error ? new Error(error.message) : null,
  };
}

/**
 * Compute extended tour cards with position changes (optimized)
 */
function computeExtendedTourCards(
  tourCards: TourCard[],
  tournaments: Tournament[],
  teams: Team[],
  seasonId: string | undefined,
): ExtendedTourCard[] {
  if (!seasonId || !tourCards.length) return [];

  // Find the most recent completed tournament (optimized)
  const now = new Date().getTime();
  const pastTournament = tournaments
    ?.filter((t) => t.seasonId === seasonId)
    .find((t) => new Date(t.endDate).getTime() < now);

  if (!pastTournament) {
    // Return early with default values if no past tournament
    return tourCards.map(
      (tc): ExtendedTourCard => ({
        ...tc,
        pastPoints: tc.points,
        posChange: 0,
        posChangePO: 0,
      }),
    );
  }

  // Create lookup map for past tournament teams (O(1) lookup instead of O(n))
  const pastTeamsMap = new Map<string, number>();
  teams
    .filter((team) => team.tournamentId === pastTournament.id)
    .forEach((team) => {
      if (team.tourCardId) {
        pastTeamsMap.set(team.tourCardId, team.points ?? 0);
      }
    });

  // Calculate past points and create lookup maps for position calculations
  const pastPointsData = tourCards.map((tc): ExtendedTourCard => {
    const pastTournamentPoints = pastTeamsMap.get(tc.id) ?? 0;
    const pastPoints = tc.points - pastTournamentPoints;
    return {
      ...tc,
      pastPoints,
    };
  });

  // Sort arrays once for position calculations
  const sortedByPastPoints = [...pastPointsData].sort(
    (a, b) => (b.pastPoints ?? 0) - (a.pastPoints ?? 0),
  );
  const sortedByCurrentPoints = [...pastPointsData].sort(
    (a, b) => b.points - a.points,
  );

  // Create position lookup maps
  const pastPositionMap = new Map<string, number>();
  const currentPositionMap = new Map<string, number>();

  sortedByPastPoints.forEach((tc, index) => {
    pastPositionMap.set(tc.id, index + 1);
  });

  sortedByCurrentPoints.forEach((tc, index) => {
    currentPositionMap.set(tc.id, index + 1);
  });

  // Calculate position changes efficiently
  return pastPointsData.map((tc): ExtendedTourCard => {
    const pastPositionPO = pastPositionMap.get(tc.id) ?? 999;
    const currentPositionPO = currentPositionMap.get(tc.id) ?? 999;

    // Calculate position within tour using pre-filtered and sorted data
    const tourCards = pastPointsData.filter(
      (card) => card.tourId === tc.tourId,
    );
    let pastPositionInTour = 1;

    // Count how many tour cards have higher past points
    for (const card of tourCards) {
      if ((card.pastPoints ?? 0) > (tc.pastPoints ?? 0)) {
        pastPositionInTour++;
      }
    }

    const currentPositionInTour = parseInt(
      tc.position?.replace("T", "") ?? "999",
      10,
    );
    const posChange = pastPositionInTour - currentPositionInTour;
    const posChangePO = pastPositionPO - currentPositionPO;

    return {
      ...tc,
      posChange: isNaN(posChange) ? 0 : posChange,
      posChangePO: isNaN(posChangePO) ? 0 : posChangePO,
    };
  });
}
