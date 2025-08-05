/**
 * React Query optimization configuration for standings
 * Add this to your query client setup for better performance
 */

import { QueryClient } from "@tanstack/react-query";

export const optimizedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce background refetch frequency
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,

      // Increase stale time for relatively static data
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Keep data in cache longer
      gcTime: 30 * 60 * 1000, // 30 minutes

      // Retry configuration
      retry: (failureCount, error) => {
        // Only retry on network errors, not 4xx/5xx
        if (
          failureCount < 3 &&
          error instanceof Error &&
          error.message?.includes("fetch")
        ) {
          return true;
        }
        return false;
      },
    },
  },
});

/**
 * Type for tRPC utils - represents the structure we need
 */
type TRPCUtils = {
  store: {
    getSeasonalData: {
      prefetch: (input: { seasonId: string }) => Promise<void>;
    };
  };
};

/**
 * Prefetch standings data using tRPC utils
 * Call this from a component that has access to tRPC utils
 *
 * Example usage:
 * ```typescript
 * const utils = api.useUtils();
 * await prefetchStandingsData(utils, seasonId);
 * ```
 */
export const prefetchStandingsData = async (
  utils: TRPCUtils,
  seasonId: string,
) => {
  try {
    await utils.store.getSeasonalData.prefetch({ seasonId });
  } catch (error) {
    console.error("Failed to prefetch standings data:", error);
  }
};
