/**
 * Custom Hook for StandingsTourCardInfo Data
 *
 * Extracts data fetching logic from the component to make it more functional
 */

import { api } from "@pgc-trpcClient";
import type { TourCard, Tournament, Team, Member } from "@prisma/client";

/**
 * Pure helper functions
 */
export const getNonPlayoffTournaments = (
  allTournaments: Tournament[] | undefined,
  seasonId: string,
  allTiers: { id: string; name: string }[] | undefined,
): Tournament[] | undefined =>
  allTournaments && allTiers
    ? allTournaments
        .filter((t) => t.seasonId === seasonId)
        .filter(
          (t) =>
            !allTiers
              .filter((tier) => tier.name.toLowerCase().includes("playoff"))
              .map((tier) => tier.id)
              .includes(t.tierId),
        )
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        )
    : undefined;

export const getTeamsForTourCard = (
  allTeams: Team[] | undefined,
  tourCardId: string,
): Team[] | undefined =>
  allTeams
    ? allTeams.filter((team) => team.tourCardId === tourCardId)
    : undefined;

export const calculateAverageScore = (
  teams: Team[] = [],
  type: "weekday" | "weekend",
): number => {
  const rounds =
    type === "weekday"
      ? teams.reduce((acc, t) => acc + (t.roundOne ?? 0) + (t.roundTwo ?? 0), 0)
      : teams.reduce(
          (acc, t) => acc + (t.roundThree ?? 0) + (t.roundFour ?? 0),
          0,
        );

  const roundCount =
    type === "weekday"
      ? teams.filter((t) => t.roundOne).length +
        teams.filter((t) => t.roundTwo).length
      : teams.filter((t) => t.roundThree).length +
        teams.filter((t) => t.roundFour).length;

  return Math.round((rounds / (roundCount || 1)) * 10) / 10;
};

/**
 * Interface for the hook return value
 */
export interface UseTourCardInfoData {
  tournaments: Tournament[] | undefined;
  teams: Team[] | undefined;
  tiers: { id: string; name: string }[] | undefined;
  isLoading: boolean;
  error: any;
}

/**
 * Custom hook for fetching tour card info data
 */
export const useTourCardInfoData = (
  tourCard: TourCard,
): UseTourCardInfoData => {
  const {
    data: allTournaments,
    isLoading: tournamentsLoading,
    error: tournamentsError,
  } = api.tournament.getAll.useQuery();

  const {
    data: allTiers,
    isLoading: tiersLoading,
    error: tiersError,
  } = api.tier.getAll.useQuery();

  const {
    data: allTeams,
    isLoading: teamsLoading,
    error: teamsError,
  } = api.team.getAll.useQuery();

  const filteredTournaments = getNonPlayoffTournaments(
    allTournaments,
    tourCard.seasonId,
    allTiers,
  );

  const teams = getTeamsForTourCard(allTeams, tourCard.id);

  return {
    tournaments: filteredTournaments,
    teams,
    tiers: allTiers,
    isLoading: tournamentsLoading || tiersLoading || teamsLoading,
    error: tournamentsError || tiersError || teamsError,
  };
};
