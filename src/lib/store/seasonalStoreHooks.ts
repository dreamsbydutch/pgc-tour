/**
 * @fileoverview Seasonal Store React Hooks
 * Provides efficient, reusable hooks for accessing and mutating seasonal data.
 * All hooks are documented for IntelliSense and code completion.
 */

import { useSeasonalStore } from "./seasonalStore";
import { api } from "@pgc-trpcClient";

// ============= INDIVIDUAL GETTERS =============

export const useSeason = () => useSeasonalStore((state) => state.season);
export const useMember = () => useSeasonalStore((state) => state.member);
export const useTourCard = () => useSeasonalStore((state) => state.tourCard);
export const useAllTourCards = () =>
  useSeasonalStore((state) => state.allTourCards);
export const useTournaments = () =>
  useSeasonalStore((state) => state.tournaments);
export const useTiers = () => useSeasonalStore((state) => state.tiers);
export const useTours = () => useSeasonalStore((state) => state.tours);
export const useLastLoaded = () =>
  useSeasonalStore((state) => state.lastLoaded);

// ============= CONVENIENCE HOOKS =============

/**
 * Returns the current tournament (status: "current") or undefined.
 */
export function useCurrentTournament() {
  const tournaments = useTournaments();
  const now = new Date();
  return tournaments?.find((t) => t.startDate <= now && t.endDate >= now);
}

/**
 * Returns all upcoming tournaments, sorted by start date ascending.
 */
export function useUpcomingTournaments() {
  const tournaments = useTournaments();
  const now = new Date();
  return (
    tournaments
      ?.filter((t) => t.startDate > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()) ?? []
  );
}

/**
 * Returns all past tournaments, sorted by end date descending.
 */
export function usePastTournaments() {
  const tournaments = useTournaments();
  const now = new Date();
  return (
    tournaments
      ?.filter((t) => t.endDate < now)
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime()) ?? []
  );
}

/**
 * Returns the current member's tour card, or undefined if not found.
 */
export function useMyTourCard() {
  const member = useMember();
  const allTourCards = useAllTourCards();
  return member && allTourCards
    ? allTourCards.find((tc) => tc.memberId === member.id)
    : undefined;
}

// ============= DERIVED HOOKS =============

/**
 * Returns tournaments grouped by status (current, upcoming, past).
 */
export function useTournamentsByStatus() {
  const current = useCurrentTournament();
  const upcoming = useUpcomingTournaments();
  const past = usePastTournaments();
  return {
    current: current ? [current] : [],
    upcoming,
    past,
  };
}

// ============= ACTIONS =============

/**
 * Hook to invalidate only the user's tour card.
 * Clears tour card cache and forces a reload from the server.
 */
export const useInvalidateTourCard = () =>
  useSeasonalStore((state) => state.invalidateTourCard);

/**
 * Hook to invalidate only all tour cards.
 * Clears all tour cards cache and forces a reload from the server.
 */
export const useInvalidateAllTourCards = () =>
  useSeasonalStore((state) => state.invalidateAllTourCards);

/**
 * Hook to invalidate both tour card and all tour cards.
 * Clears both tour card caches and forces a reload from the server.
 */
export const useInvalidateTourCards = () =>
  useSeasonalStore((state) => state.invalidateAndRefetchTourCards);

/**
 * Hook to manually refresh tour card data.
 * This will invalidate the tour card cache and refetch from the server.
 * Useful for refresh buttons or when user wants to manually update data.
 */
export function useManualRefresh() {
  const invalidateTourCards = useInvalidateTourCards();
  const utils = api.useUtils();

  const refreshTourCards = async () => {
    // Invalidate the client cache
    invalidateTourCards();

    // Invalidate tRPC queries to force refetch
    await utils.tourCard.getSelfCurrent.invalidate();
    await utils.store.getSeasonalData.invalidate();
    await utils.store.getLastTourCardsUpdate.invalidate();
  };

  return { refreshTourCards };
}

/**
 * Hook to check if tour card data is stale based on server timestamp.
 * Returns true if the server has newer data than what's cached locally.
 */
export function useIsTourCardDataStale() {
  const lastLoaded = useLastLoaded();
  const season = useSeason();

  const lastTourCardsUpdateQuery = api.store.getLastTourCardsUpdate.useQuery(
    { seasonId: season?.id ?? "" },
    {
      enabled: !!season?.id,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 2 * 60 * 1000, // 2 minutes
    },
  );

  const isStale = (() => {
    if (!lastTourCardsUpdateQuery.data?.lastUpdated) return false;
    if (!lastLoaded?.tourCard && !lastLoaded?.allTourCards) return true;

    const serverTimestamp = new Date(
      lastTourCardsUpdateQuery.data.lastUpdated,
    ).getTime();
    const localTourCardTimestamp = lastLoaded?.tourCard ?? 0;
    const localAllTourCardsTimestamp = lastLoaded?.allTourCards ?? 0;

    return (
      serverTimestamp > localTourCardTimestamp ||
      serverTimestamp > localAllTourCardsTimestamp
    );
  })();

  return {
    isStale,
    lastServerUpdate: lastTourCardsUpdateQuery.data?.lastUpdated,
    isLoading: lastTourCardsUpdateQuery.isLoading,
    error: lastTourCardsUpdateQuery.error,
  };
}

/**
 * Example usage of useInvalidateTourCards:
 *
 * ```tsx
 * import { useInvalidateTourCards } from '@/lib/store/seasonalStoreHooks';
 *
 * function MyComponent() {
 *   const invalidateTourCards = useInvalidateTourCards();
 *
 *   const handleRefresh = () => {
 *     invalidateTourCards();
 *   };
 *
 *   return <button onClick={handleRefresh}>Refresh Tour Cards</button>;
 * }
 * ```
 *
 * Example usage of useManualRefresh and useIsTourCardDataStale:
 *
 * ```tsx
 * import { useManualRefresh, useIsTourCardDataStale } from '@/lib/store/seasonalStoreHooks';
 *
 * function RefreshButton() {
 *   const { refreshTourCards } = useManualRefresh();
 *   const { isStale, lastServerUpdate } = useIsTourCardDataStale();
 *
 *   const handleRefresh = async () => {
 *     await refreshTourCards();
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleRefresh}>
 *         Refresh Tour Cards {isStale ? '(Update Available)' : ''}
 *       </button>
 *       {lastServerUpdate && (
 *         <p>Last updated: {new Date(lastServerUpdate).toLocaleString()}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
