/**
 * Custom hook for fetching all data needed for StandingsView
 *
 * This hook orchestrates all the data fetching required for the standings,
 * including tours, tour cards, members, teams, and tournaments.
 * It computes extended tour cards with position changes and returns
 * the data in a normalized format with loading and error states.
 *
 * @returns Object containing standings data, loading state, and error state
 */

import { useMemo } from "react";
import { api } from "@pgc-trpcClient";
import {
  useAllTourCards,
  useSeason,
  useTiers,
  useTournaments,
  useTours,
  useMember,
} from "@pgc-store";
import type { TourCard, Tournament, Team } from "@prisma/client";
import type {
  StandingsData,
  StandingsState,
  ExtendedTourCard,
} from "../utils/types";

/**
 * Hook for fetching all standings data
 *
 * This hook manages the complex data fetching and transformation needed
 * for the standings display, including computing position changes and
 * other derived properties.
 */
export function useStandingsData(): StandingsState {
  const currentMember = useMember();
  const season = useSeason();
  const tournaments = useTournaments();
  const tourCards = useAllTourCards();
  const tours = useTours();
  const tiers = useTiers();

  const seasonId = season?.id;

  // Get tournament IDs for current season
  const tournamentIds = useMemo(
    () =>
      tournaments?.filter((t) => t.seasonId === seasonId).map((t) => t.id) ??
      [],
    [tournaments, seasonId],
  );

  // Fetch all teams for tournaments in current season
  const allTeams = api.team.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Filter teams for current season tournaments
  const teams = useMemo(
    () =>
      allTeams.data?.filter((team) =>
        tournamentIds.includes(team.tournamentId),
      ) ?? [],
    [allTeams.data, tournamentIds],
  );

  // Compute extended tour cards with position changes
  const extendedTourCards = useMemo(() => {
    if (!tourCards || !tournaments) return [];

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

  const isLoading = allTeams.isLoading || !tours || !tourCards || !seasonId;
  const error = allTeams.error;

  const data: StandingsData | null = useMemo(() => {
    if (isLoading || !tours || !tiers || !seasonId) return null;

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
    isLoading,
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
 * Compute extended tour cards with position changes
 */
function computeExtendedTourCards(
  tourCards: TourCard[],
  tournaments: Tournament[],
  teams: Team[],
  seasonId: string | undefined,
): ExtendedTourCard[] {
  if (!seasonId) return [];

  // Find the most recent completed tournament
  const pastTournament = tournaments
    ?.filter((t) => t.seasonId === seasonId && new Date(t.endDate) < new Date())
    .sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    )[0];

  if (!pastTournament) {
    return tourCards.map(
      (tc): ExtendedTourCard => ({
        ...tc,
        pastPoints: tc.points,
        posChange: 0,
        posChangePO: 0,
      }),
    );
  }

  // Get teams from the past tournament
  const pastTeams = teams.filter(
    (team) => team.tournamentId === pastTournament.id,
  );

  // Calculate past points (current points minus points from last tournament)
  const pastPoints = tourCards.map((tc): ExtendedTourCard => {
    const pastTournamentPoints =
      pastTeams.find((team) => team.tourCardId === tc.id)?.points ?? 0;
    const pastPoints = tc.points - pastTournamentPoints;
    return {
      ...tc,
      pastPoints,
    };
  });

  // Calculate position changes
  const withPositionChanges = pastPoints.map((tc): ExtendedTourCard => {
    // Calculate past position within tour
    const pastPosition =
      pastPoints.filter(
        (p) =>
          (p.pastPoints ?? 0) > (tc.pastPoints ?? 0) && p.tourId === tc.tourId,
      ).length + 1;

    // Calculate past position overall (playoffs)
    const pastPositionPO =
      pastPoints.filter((p) => (p.pastPoints ?? 0) > (tc.pastPoints ?? 0))
        .length + 1;

    // Calculate current position overall (playoffs)
    const positionPO =
      pastPoints.filter((p) => p.points > tc.points).length + 1;

    // Calculate position change within tour
    const currentPosition = parseInt(
      tc.position?.replace("T", "") ?? "999",
      10,
    );
    const posChange = pastPosition - currentPosition;

    // Calculate position change overall
    const posChangePO = pastPositionPO - positionPO;

    return {
      ...tc,
      posChange: isNaN(posChange) ? 0 : posChange,
      posChangePO: isNaN(posChangePO) ? 0 : posChangePO,
    };
  });

  return withPositionChanges;
}
