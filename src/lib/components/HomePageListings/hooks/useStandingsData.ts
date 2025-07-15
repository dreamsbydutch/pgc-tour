"use client";

/**
 * HomePageListings - Standings data fetching hook
 * Simple hook that returns store data directly
 */

import { useAllTourCards, useMember,useTours } from "@pgc-store";
import type { HomePageListingsStandingsProps } from "../utils/types";
import { api } from "@pgc-trpcClient";

/**
 * Hook to get standings data from the store
 * Just returns store data, no fancy processing
 */
export const useStandingsData = () => {
  const tours = useTours();
  const allTourCards = useAllTourCards();
  const member = useMember();

  // Properly handle the champions query with enabled flag and error handling
  const {
    data: champions,
    isLoading: championsLoading,
    error: championsError,
  } = api.team.getAllChampions.useQuery();

  // Simple loading check
  const isLoading = !tours || !allTourCards || !member || championsLoading;
  const error = championsError?.message ?? null;

  // Simple data transformation - no memoization to avoid re-render issues
  let data: HomePageListingsStandingsProps | null = null;

  if (tours && allTourCards && member) {
    data = {
      tours,
      tourCards: allTourCards,
      self: member,
      champions,
    };
  }

  return { data, isLoading, error };
};
