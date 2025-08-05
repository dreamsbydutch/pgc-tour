/**
 * Optimized custom hook for fetching standings data
 *
 * This hook uses server-side pre-computed data to significantly reduce loading times.
 * Position changes and other expensive calculations are done on the server.
 *
 * @returns Object containing standings data, loading state, and error state
 */

import { useMemo } from "react";
import { api } from "@pgc-trpcClient";
import { useMember, useSeason } from "@pgc-store";
import type { StandingsData, StandingsState } from "../utils/types";

/**
 * Optimized hook for fetching all standings data
 *
 * Uses server-side pre-computation to reduce client-side processing
 * and improve loading performance.
 */
export function useOptimizedStandingsData(): StandingsState {
  const currentMember = useMember();
  const season = useSeason();
  const seasonId = season?.id;

  // Single optimized query with server-side computation
  const standingsQuery = api.store.getStandingsData.useQuery(
    { seasonId: seasonId ?? "" },
    {
      enabled: !!seasonId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  );

  // Find current user's tour card from pre-computed data
  const currentTourCard = useMemo(() => {
    if (!currentMember || !standingsQuery.data?.allTourCards) return null;
    return (
      standingsQuery.data.allTourCards.find(
        (tc) => tc.memberId === currentMember.id,
      ) ?? null
    );
  }, [standingsQuery.data?.allTourCards, currentMember]);

  // Filter tournaments for current season (already filtered on server)
  const seasonTournaments = standingsQuery.data?.tournaments ?? [];

  const isLoading = standingsQuery.isLoading || !seasonId;
  const error = standingsQuery.error;

  const data: StandingsData | null = useMemo(() => {
    if (!standingsQuery.data || !seasonId) return null;

    return {
      tours: standingsQuery.data.tours,
      tiers: standingsQuery.data.tiers,
      tourCards: standingsQuery.data.allTourCards,
      currentTourCard,
      currentMember,
      teams: standingsQuery.data.teams,
      tournaments: seasonTournaments,
      seasonId,
    };
  }, [
    standingsQuery.data,
    seasonId,
    currentTourCard,
    currentMember,
    seasonTournaments,
  ]);

  return {
    data,
    isLoading,
    error: error ? new Error(error.message) : null,
  };
}
