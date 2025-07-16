"use client";

import { useMemo } from "react";

import {
  useAllTourCards,
  useSeason,
  useTiers,
  useTournaments,
  useTours,
  useMember,
} from "@pgc-store";
import { api } from "@pgc-trpcClient";

export function useCurrentStandings() {
  const currentMember = useMember();
  const season = useSeason();
  const seasonId = season?.id;
  const tournaments = useTournaments();
  const tourCards = useAllTourCards();
  const tours = useTours();
  const tiers = useTiers();
  const currentTourCard = useMemo(() => {
    if (!tourCards || !currentMember) return null;
    return tourCards.find((tc) => tc.memberId === currentMember.id);
  }, [tourCards, currentMember]);

  // Get all teams for all tournaments in the current season
  const tournamentIds = useMemo(
    () =>
      tournaments?.filter((t) => t.seasonId === seasonId).map((t) => t.id) ??
      [],
    [tournaments, seasonId],
  );
  const allTeams = api.team.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const teams = useMemo(
    () =>
      allTeams.data?.filter((team) =>
        tournamentIds.includes(team.tournamentId),
      ) ?? [],
    [allTeams.data, tournamentIds],
  );

  const pastTournament = tournaments
    ?.filter((t) => new Date(t.endDate) < new Date())
    .sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    )[0];
  const pastTeams = teams.filter(
    (team) => team.tournamentId === pastTournament?.id,
  );
  const pastPoints = tourCards?.map((tc) => {
    const pastPoints =
      tc.points -
      (pastTeams.find((team) => team.tourCardId === tc.id)?.points ?? 0);
    return {
      ...tc,
      pastPoints,
    };
  });
  const pastPositions = pastPoints?.map((tc) => {
    const pastPosition =
      pastPoints.filter(
        (p) => p.pastPoints > tc.pastPoints && p.tourId === tc.tourId,
      ).length + 1;
    const pastPositionPO =
      pastPoints.filter((p) => p.pastPoints > tc.pastPoints).length + 1;
    const positionPO =
      pastPoints.filter((p) => p.points > tc.points).length + 1;
    return {
      ...tc,
      posChange:
        pastPosition - parseInt(tc.position?.replace("T", "") ?? "", 10),
      posChangePO: pastPositionPO - positionPO,
    };
  });

  const isLoading = allTeams.isLoading || !tours || !tourCards || !seasonId;
  const error = allTeams.error;

  return {
    teams,
    tours,
    tiers,
    tourCards: pastPositions,
    currentTourCard,
    currentMember,
    tournaments: tournaments?.filter((t) => t.seasonId === seasonId) ?? [],
    seasonId,
    isLoading,
    error,
    refetch: allTeams.refetch,
  };
}
