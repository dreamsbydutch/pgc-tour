/**
 * Data Processing Hooks for History Components
 * 
 * This module provides custom React hooks for processing and transforming
 * tournament, team, and member data for the history section. All hooks use
 * React's useMemo for optimal performance and prevent unnecessary recalculations.
 * 
 * Key Features:
 * - Tournament filtering and processing with tier adjustments
 * - Team position calculations and earnings adjustments
 * - Member data aggregation with tour card associations
 * - Sorting utilities for various display requirements
 * 
 * Architecture:
 * - Each hook focuses on a specific data transformation concern
 * - Memoization ensures calculations only run when dependencies change
 * - Type-safe implementations with proper TypeScript support
 * - Handles edge cases and null/undefined data gracefully
 */
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
 * 
 * Transforms raw tournament data by:
 * - Filtering out future tournaments and playoff tournaments (except TOUR Championship)
 * - Adding both regular and adjusted team calculations
 * - Applying current tier values for adjusted calculations
 * - Ensuring proper team positioning and earnings calculations
 * 
 * @param params - Object containing tournament processing parameters
 * @param params.inputTournaments - Raw tournament data from API
 * @param params.tiers - Available tier definitions
 * @param params.tourCards - Tour card data for member associations
 * @param params.currentTiers - Current tier values for adjustment calculations
 * @returns Processed tournament array with extended team data
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
 * 
 * Extracts and flattens team data from processed tournaments, providing
 * both regular and adjusted team arrays for further processing.
 * 
 * @param tournaments - Array of processed tournaments with team data
 * @returns Object containing flattened teams and adjustedTeams arrays
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
 * 
 * Aggregates comprehensive member statistics by:
 * - Associating tour cards with their respective members
 * - Calculating total regular and adjusted earnings/points
 * - Linking team performance data to member records
 * - Processing adjusted values based on current tier calculations
 * 
 * The hook creates extended member objects that include all tournament
 * participation history, earnings summaries, and performance metrics.
 * 
 * @param params - Object containing member processing parameters
 * @param params.members - Raw member data from API
 * @param params.tourCards - Tour card associations for members
 * @param params.teams - Regular team performance data
 * @param params.adjustedTeams - Adjusted team performance data
 * @returns Array of extended member objects with comprehensive statistics
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
 * 
 * Provides sorted member data based on total career earnings, with
 * support for both regular and adjusted earnings calculations.
 * 
 * The sorting algorithm:
 * - Calculates total earnings across all tour cards for each member
 * - Uses adjusted earnings when showAdjusted is true
 * - Falls back to regular earnings when adjusted values are unavailable
 * - Sorts in descending order (highest earners first)
 * 
 * @param memberData - Array of extended member objects to sort
 * @param showAdjusted - Whether to use adjusted or regular earnings for sorting
 * @returns Sorted array of member data by total earnings
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
