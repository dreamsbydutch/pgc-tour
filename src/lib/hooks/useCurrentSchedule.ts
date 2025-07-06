/**
 * Current Schedule Hook - Client-side Tournament Schedule
 * Provides current season's tournament schedule for client components
 *
 * This hook fetches the current season's tournaments with tier and course
 * information included using tRPC queries.
 *
 * @module useCurrentSchedule
 */

import { api } from "@/trpc/react";
import { useMemo } from "react";

/**
 * Hook to get the current season's tournament schedule
 *
 * @returns {Object} Object containing tournaments data, loading state, and error
 */
export function useCurrentSchedule() {
  // Get current season
  const {
    data: currentSeason,
    isLoading: seasonLoading,
    error: seasonError,
  } = api.season.getCurrent.useQuery();

  // Get tournaments for current season
  const {
    data: tournaments = [],
    isLoading: tournamentsLoading,
    error: tournamentsError,
  } = api.tournament.getBySeason.useQuery(
    { seasonId: currentSeason?.id ?? "" },
    { enabled: !!currentSeason?.id },
  );

  const isLoading = seasonLoading || tournamentsLoading;
  const error = seasonError || tournamentsError;

  return useMemo(
    () => ({
      tournaments,
      isLoading,
      error,
      currentSeason,
    }),
    [tournaments, isLoading, error, currentSeason],
  );
}
