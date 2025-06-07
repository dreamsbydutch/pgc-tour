"use client";

import { useMemo } from "react";
import type {
  ExtendedMember,
  ExtendedTourCard,
  ExtendedTournament,
} from "../../types";
import { updateTeamPositions } from "../../utils/team-calculations";
import type { Member, Team, Tier, TourCard, Tournament } from "@prisma/client";

/**
 * Custom hook to process tournament data
 */
export function useProcessedTournaments({
  inputTournaments,
  tiers,
  tourCards,
  currentTiers,
}: {
  inputTournaments: Tournament[] | undefined;
  tiers: Tier[] | undefined;
  tourCards: TourCard[] | undefined;
  currentTiers: Tier[] | undefined;
}) {
  // Process tournaments with memoization to avoid unnecessary recalculations
  return useMemo(() => {
    if (!inputTournaments || !tiers || !tourCards || !currentTiers) {
      return [];
    }

    return (inputTournaments ?? [])
      .map((tourney: ExtendedTournament) => {
        if (
          tiers?.find((t) => t.id === tourney?.tierId)?.name === "Playoff" &&
          tourney?.name !== "TOUR Championship"
        )
          return undefined;

        const actualTier = tiers?.find((t) => t.id === tourney?.tierId);
        const comparableTier = currentTiers?.find(
          (t) => t.name === actualTier?.name,
        );
        const tourneyTourCards = tourCards?.filter(
          (obj) => obj.seasonId === tourney?.seasonId,
        );

        const tourneyTeams = updateTeamPositions(
          [...(tourney.teams ?? [])],
          tourneyTourCards,
          actualTier,
          tourney.name,
        );
        const tourneyAdjustedTeams = updateTeamPositions(
          [...(tourney.teams ?? [])],
          tourneyTourCards,
          comparableTier,
          tourney.name,
        );

        tourney.teams = tourneyTeams;
        tourney.adjustedTeams = tourneyAdjustedTeams;
        return tourney;
      })
      .filter((t): t is ExtendedTournament => t !== undefined);
  }, [inputTournaments, tiers, tourCards, currentTiers]);
}

/**
 * Custom hook to process teams data
 */
export function useProcessedTeams(tournaments: ExtendedTournament[]) {
  return useMemo(() => {
    return {
      teams: tournaments
        ?.map((t) => t.teams)
        .flat()
        .filter(Boolean),
      adjustedTeams: tournaments
        ?.map((t) => t.adjustedTeams)
        .flat()
        .filter(Boolean),
    };
  }, [tournaments]);
}

/**
 * Custom hook to process member data
 */
export function useProcessedMemberData({
  members,
  tourCards,
  teams,
  adjustedTeams,
}: {
  members: Member[] | undefined;
  tourCards: TourCard[] | undefined;
  teams: Team[] | undefined;
  adjustedTeams: Team[] | undefined;
}) {
  return useMemo(() => {
    if (!members || !tourCards) return [];

    return members?.map((obj) => {
      // Find tour cards belonging to this member
      const memberTourCards = tourCards?.filter((tc) => tc.memberId === obj.id);

      // Find teams associated with this member's tour cards
      const memberTeams = teams?.filter((t) =>
        memberTourCards?.some((tc) => tc.id === t?.tourCardId),
      );

      // Find adjusted teams associated with this member's tour cards
      const memberAdjustedTeams = adjustedTeams?.filter((t) =>
        memberTourCards?.some((tc) => tc.id === t?.tourCardId),
      );

      // Calculate adjusted earnings and points for tour cards
      const processedTourCards = memberTourCards?.map((tc) => {
        // Calculate total adjusted points from all adjusted teams for this tour card
        const adjustedPoints =
          memberAdjustedTeams
            ?.filter((team) => team?.tourCardId === tc.id)
            ?.reduce((sum, team) => sum + (team?.points ?? 0), 0) ?? 0;

        // Calculate total adjusted earnings from all adjusted teams for this tour card
        const adjustedEarnings =
          memberAdjustedTeams
            ?.filter((team) => team?.tourCardId === tc.id)
            ?.reduce((sum, team) => sum + (team?.earnings ?? 0), 0) ?? 0;

        return {
          ...tc,
          adjustedPoints,
          adjustedEarnings,
        } as ExtendedTourCard;
      });

      return {
        ...obj,
        tourCards: processedTourCards,
        teams: memberTeams,
        adjustedTeams: memberAdjustedTeams,
      } as ExtendedMember;
    });
  }, [members, tourCards, teams, adjustedTeams]);
}

/**
 * Custom hook to sort member data by earnings
 */
export function useSortedMemberData(
  memberData: ExtendedMember[],
  showAdjusted: boolean,
) {
  return useMemo(() => {
    if (!memberData) return [];

    return [...memberData].sort(
      (a, b) =>
        (b.tourCards?.reduce(
          (p, c) =>
            (p += showAdjusted
              ? (c.adjustedEarnings ?? c.earnings)
              : c.earnings),
          0,
        ) ?? 0) -
        (a.tourCards?.reduce(
          (p, c) =>
            (p += showAdjusted
              ? (c.adjustedEarnings ?? c.earnings)
              : c.earnings),
          0,
        ) ?? 0),
    );
  }, [memberData, showAdjusted]);
}
