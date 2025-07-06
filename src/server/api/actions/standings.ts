/**
 * Standings Server Actions
 * Server-side functions for fetching current standings data
 *
 * Provides current season tour standings for server-side rendering
 * and server components.
 */

import { api } from "@/trpc/server";

/**
 * Get current standings for all tours
 * Returns tours with their top tour cards sorted by standings
 */
export async function getCurrentStandings() {
  try {
    // Get current season
    const currentSeason = await api.season.getCurrent();

    if (!currentSeason) {
      return [];
    }

    // Get all tours for current season
    const tours = await api.tour.getBySeason({
      seasonId: currentSeason.id,
    });

    if (!tours || tours.length === 0) {
      return [];
    }

    // Get all tour cards for current season
    const allTourCards = await api.tourCard.getBySeason({
      seasonId: currentSeason.id,
    });

    // Group tour cards by tour and sort by points (descending)
    const toursWithStandings = tours
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id)) // Sort tours by tour id
      .map((tour) => {
        const tourCards = allTourCards
          .filter((tourCard) => tourCard.tourId === tour.id)
          .sort((a, b) => (b.points || 0) - (a.points || 0)); // Sort by points descending

        return {
          ...tour,
          tourCards,
        };
      });

    return toursWithStandings;
  } catch (error) {
    console.error("Error fetching current standings:", error);
    return [];
  }
}
