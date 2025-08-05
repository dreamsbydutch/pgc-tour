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
        if (failureCount < 3 && error.message?.includes("fetch")) {
          return true;
        }
        return false;
      },
    },
  },
});

// Optional: Prefetch critical data
export const prefetchStandingsData = async (seasonId: string) => {
  await optimizedQueryClient.prefetchQuery({
    queryKey: ["store", "getSeasonalData", { seasonId }],
    queryFn: () => api.store.getSeasonalData.query({ seasonId }),
    staleTime: 5 * 60 * 1000,
  });
};
