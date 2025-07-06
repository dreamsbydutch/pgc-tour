/**
 * Current Standings Hook - Client-side Tour Standings
 * Provides current season standings for all tours in client components
 *
 * This hook fetches the current season's tour standings with tour cards
 * sorted by points for each tour.
 *
 * @module useCurrentStandings
 */

import { api } from "@/trpc/react";
import { useMemo, useEffect, useState } from "react";
import type { Tour, TourCard, Tier, Member } from "@prisma/client";

// Types for the data structures used in the standings page
export type StandingsTour = Tour & {
  tourCards: (TourCard & { points?: number })[];
  playoffSpots: number[];
  shortForm: string;
};

export type StandingsTier = Tier & {
  payouts: number[];
  points: number[];
};

export interface UseCurrentStandingsResult {
  tours: StandingsTour[];
  isLoading: boolean;
  error: unknown;
  userTourCard: (TourCard & { points?: number }) | undefined;
  activeTour: StandingsTour | undefined;
  tiers: StandingsTier[];
  member: Member | null;
}

/**
 * Hook to get the current season's standings for all tours
 *
 * @returns {Object} Object containing tours with standings data, loading state, and error
 */
export function useCurrentStandings(): UseCurrentStandingsResult {
  // Get current season
  const {
    data: currentSeason,
    isLoading: seasonLoading,
    error: seasonError,
  } = api.season.getCurrent.useQuery();

  // Get tours for current season
  const {
    data: tours = [],
    isLoading: toursLoading,
    error: toursError,
  } = api.tour.getBySeason.useQuery(
    { seasonId: currentSeason?.id ?? "" },
    { enabled: !!currentSeason?.id },
  );

  // Get tour cards for current season
  const {
    data: allTourCards = [],
    isLoading: tourCardsLoading,
    error: tourCardsError,
  } = api.tourCard.getBySeason.useQuery(
    { seasonId: currentSeason?.id ?? "" },
    { enabled: !!currentSeason?.id },
  );

  // Get tiers for current season
  const {
    data: tiers = [],
    isLoading: tiersLoading,
    error: tiersError,
  } = api.tier.getBySeason.useQuery(
    { seasonId: currentSeason?.id ?? "" },
    { enabled: !!currentSeason?.id },
  );

  // Get current user
  const {
    data: member = null,
    isLoading: memberLoading,
    error: memberError,
  } = api.member.getSelf.useQuery();

  // Combine tours with their sorted tour cards
  const toursWithStandings: StandingsTour[] = useMemo(() => {
    if (!tours.length || !allTourCards.length) return [];
    return tours.map((tour) => {
      const tourCards = allTourCards
        .filter((tourCard) => tourCard.tourId === tour.id)
        .sort((a, b) => (b.points || 0) - (a.points || 0)); // Sort by points descending
      return {
        ...tour,
        tourCards,
        playoffSpots: (tour as any).playoffSpots || [],
        shortForm: (tour as any).shortForm || tour.name,
      };
    });
  }, [tours, allTourCards]);

  // Find the user's tour card (if logged in)
  const userTourCard = useMemo(() => {
    if (!member || !allTourCards.length) return undefined;
    return allTourCards.find((tc) => tc.memberId === member.id);
  }, [member, allTourCards]);

  // Get activeTourId from localStorage (client only)
  const [localActiveTourId, setLocalActiveTourId] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalActiveTourId(localStorage.getItem("activeTour"));
    }
  }, [toursWithStandings.length]);

  // Determine the active tour (prefer localStorage, then user, then first)
  const activeTour = useMemo(() => {
    if (!toursWithStandings.length) return undefined;
    if (localActiveTourId) {
      const found = toursWithStandings.find(
        (tour) => tour.id === localActiveTourId,
      );
      if (found) return found;
    }
    if (userTourCard) {
      return (
        toursWithStandings.find((tour) =>
          tour.tourCards.some((tc) => tc.id === userTourCard.id),
        ) || toursWithStandings[0]
      );
    }
    return toursWithStandings[0];
  }, [toursWithStandings, userTourCard, localActiveTourId]);

  const isLoading =
    seasonLoading ||
    toursLoading ||
    tourCardsLoading ||
    tiersLoading ||
    memberLoading;
  const error =
    seasonError || toursError || tourCardsError || tiersError || memberError;

  return {
    tours: toursWithStandings,
    isLoading,
    error,
    userTourCard,
    activeTour,
    tiers: tiers as StandingsTier[],
    member,
  };
}
