/**
 * Tour Card Hook - Unified Tour Card Data
 * Handles all tour card filtering and member-specific queries
 *
 * This hook provides a streamlined interface for accessing tour card data
 * with filtering capabilities, leveraging the seasonal store for efficient processing.
 *
 * @module useTourCard
 */

import { useSeasonalStore } from "../store/seasonalStore";
import { useMemo } from "react";
import type {
  MinimalTourCard,
  TourCardFilters,
  EnhancedTourCardsResult,
} from "@/lib/types";
import { useCurrentSeason } from "./useSeasons";

/**
 * Returns filtered tour cards with configurable sorting
 *
 * @param filters - Optional filters to apply to tour cards
 * @returns Array of filtered and sorted tour cards
 *
 * @example
 * ```typescript
 * // Get all tour cards
 * const allCards = useTourCards();
 *
 * // Get tour cards for specific tours
 * const tourCards = useTourCards({
 *   tourIds: ["tour-1", "tour-2"]
 * });
 *
 * // Get cards with minimum earnings
 * const highEarners = useTourCards({
 *   earnings: { min: 1000 }
 * });
 * ```
 */
export function useTourCards(filters?: TourCardFilters): MinimalTourCard[] {
  const { getTourCards } = useSeasonalStore();

  return useMemo(() => {
    return getTourCards(filters, "earnings", "desc");
  }, [getTourCards, filters]);
}

/**
 * Returns tour cards for a specific member
 *
 * @param memberId - The member ID to get tour cards for
 * @returns Array of tour cards for the specified member
 *
 * @example
 * ```typescript
 * const memberCards = useMemberCards("member-123");
 * ```
 */
export function useMemberCards(memberId: string): MinimalTourCard[] {
  const tourCards = useTourCards({ memberIds: [memberId] });
  return tourCards;
}

/**
 * Returns tour cards for multiple members
 *
 * @param memberIds - Array of member IDs to get tour cards for
 * @returns Array of tour cards for the specified members
 *
 * @example
 * ```typescript
 * const teamCards = useMemberCards(["member-1", "member-2"]);
 * ```
 */
export function useMultipleMemberCards(memberIds: string[]): MinimalTourCard[] {
  const tourCards = useTourCards({ memberIds });
  return tourCards;
}

/**
 * Returns tour cards for a specific tour
 *
 * @param tourId - The tour ID to get tour cards for
 * @returns Array of tour cards for the specified tour
 *
 * @example
 * ```typescript
 * const tourCards = useTourCards("tour-123");
 * ```
 */
export function useTourSpecificCards(tourId: string): MinimalTourCard[] {
  const tourCards = useTourCards({ tourIds: [tourId] });
  return tourCards;
}

/**
 * Returns tour cards with earnings above a threshold
 *
 * @param minEarnings - Minimum earnings threshold
 * @returns Array of tour cards with earnings >= minEarnings
 *
 * @example
 * ```typescript
 * const highEarners = useHighEarningCards(1000);
 * ```
 */
export function useHighEarningCards(minEarnings: number): MinimalTourCard[] {
  const tourCards = useTourCards({
    earnings: { min: minEarnings },
    hasEarnings: true,
  });
  return tourCards;
}

/**
 * Enhanced tour cards hook with basic result data
 * Note: Full enrichment with tour/member data would require API calls,
 * so this provides enhanced metadata while using store data
 *
 * @param filters - Optional filters to apply to tour cards
 * @returns Basic tour cards result with metadata and utilities
 */
export function useTourCardsEnhanced(filters?: TourCardFilters) {
  const { getTourCards, allTourCards } = useSeasonalStore();

  return useMemo(() => {
    const now = new Date();
    const startTime = performance.now();

    // Get filtered tour cards
    const filteredCards = getTourCards(filters, "earnings", "desc");
    const allCards = allTourCards || [];

    // Calculate statistics
    const totalEarnings = filteredCards.reduce(
      (sum, card) => sum + (card.earnings || 0),
      0,
    );
    const totalPoints = filteredCards.reduce(
      (sum, card) => sum + (card.points || 0),
      0,
    );
    const averageEarnings =
      filteredCards.length > 0 ? totalEarnings / filteredCards.length : 0;
    const averagePoints =
      filteredCards.length > 0 ? totalPoints / filteredCards.length : 0;

    // Get top earners (top 5)
    const topEarners = filteredCards
      .filter((card) => (card.earnings || 0) > 0)
      .sort((a, b) => (b.earnings || 0) - (a.earnings || 0))
      .slice(0, 5);

    // Group by tour
    const byTour = filteredCards.reduce(
      (acc, card) => {
        const tourId = card.tourId;
        acc[tourId] = (acc[tourId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Create utility functions (using MinimalTourCard types)
    const utils = {
      filterBy: (newFilters: Partial<TourCardFilters>) =>
        getTourCards({ ...filters, ...newFilters }, "earnings", "desc"),

      sortBy: (
        field: "earnings" | "points" | "position",
        direction: "asc" | "desc" = "asc",
      ) => {
        return [...filteredCards].sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];

          // Handle null/undefined values
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return direction === "asc" ? 1 : -1;
          if (bVal == null) return direction === "asc" ? -1 : 1;

          if (aVal < bVal) return direction === "asc" ? -1 : 1;
          if (aVal > bVal) return direction === "asc" ? 1 : -1;
          return 0;
        });
      },

      searchCards: (query: string) =>
        filteredCards.filter(
          (card) =>
            card.memberId?.toLowerCase().includes(query.toLowerCase()) ||
            card.tourId?.toLowerCase().includes(query.toLowerCase()),
        ),

      getByMember: (memberId: string) =>
        filteredCards.filter((card) => card.memberId === memberId),
    };

    // Calculate performance metrics
    const queryTime = performance.now() - startTime;

    return {
      tourCards: filteredCards,
      isLoading: false,
      error: null,
      filtered: filteredCards,
      total: allCards.length,
      stats: {
        totalEarnings,
        totalPoints,
        averageEarnings,
        averagePoints,
        topEarners,
        byTour,
      },
      filters: filters || {},
      utils,
      meta: {
        queryTime,
        cacheHit: true,
        dataSource: "store" as const,
      },
    };
  }, [getTourCards, allTourCards, filters]);
}

export function useCurrentSeasonTourCardId(
  memberId: string,
): string | undefined {
  const cards = useTourCards({ memberIds: [memberId] });
  const currentSeason = useCurrentSeason();
  if (!currentSeason) return undefined;
  const card = cards.find((c) => c.seasonId === currentSeason.id);
  return card?.id;
}
