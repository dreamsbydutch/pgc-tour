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
import { useMemo } from "react";

/**
 * Hook to get the current season's standings for all tours
 *
 * @returns {Object} Object containing tours with standings data, loading state, and error
 */
export function useCurrentStandings() {
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

  // Combine tours with their sorted tour cards
  const toursWithStandings = useMemo(() => {
    if (!tours.length || !allTourCards.length) return [];

    return tours.map((tour) => {
      const tourCards = allTourCards
        .filter((tourCard) => tourCard.tourId === tour.id)
        .sort((a, b) => (b.points || 0) - (a.points || 0)); // Sort by points descending

      return {
        ...tour,
        tourCards,
      };
    });
  }, [tours, allTourCards]);

  const isLoading = seasonLoading || toursLoading || tourCardsLoading;
  const error = seasonError || toursError || tourCardsError;

  return useMemo(
    () => ({
      tours: toursWithStandings,
      isLoading,
      error,
      currentSeason,
    }),
    [toursWithStandings, isLoading, error, currentSeason],
  );
}
