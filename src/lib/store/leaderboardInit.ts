"use client";

import { useEffect } from "react";
import { api } from "@/src/trpc/react";
import { useLeaderboardStore, useMainStore } from "@/src/lib/store/store";

/**
 * Hook to poll current tournament leaderboard data and update LeaderboardStore
 */
export function useLeaderboardPolling({
  enabled = true,
  refetchInterval = 180000, // 3 minutes by default
  onSuccess,
  onError,
}: {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) {
  // Access the current tournament from main store
  const currentTournament = useMainStore((state) => state.currentTournament);
  const updateStore = useLeaderboardStore((state) => state.update);
  const setPolling = useLeaderboardStore((state) => state.setPolling);

  // Only enable if there's a current tournament and enabled is true
  const shouldFetch = enabled && !!currentTournament?.id;

  // Create tRPC procedure for your leaderboard endpoint
  const { data, isLoading, isError, error, refetch, isRefetching } =
    api.tournament.getLeaderboard.useQuery(
      { tournamentId: currentTournament?.id ?? "" },
      {
        enabled: shouldFetch,
        refetchInterval: shouldFetch ? refetchInterval : false,
      },
    );

  // Handle success and error cases with useEffect
  useEffect(() => {
    if (data && !isError) {
      // Update the Zustand store with the fetched data
      updateStore(data.teams, data.golfers);
      onSuccess?.();
    }
  }, [data, isError, updateStore, onSuccess]);

  // Handle error cases
  useEffect(() => {
    if (isError && error) {
      console.error("Error fetching leaderboard data:", error);
      onError?.(error as unknown as Error);
    }
  }, [isError, error, onError]);

  // Update polling status in the store
  useEffect(() => {
    setPolling(shouldFetch);
    return () => setPolling(false);
  }, [shouldFetch, setPolling]);

  return {
    currentTournament,
    data,
    isLoading,
    isError,
    error,
    isRefetching,
    refreshNow: refetch,
    isPolling: shouldFetch,
  };
}

/**
 * Function to manually update the leaderboard without using the hook
 */
export async function updateLeaderboardNow() {
  try {
    const response = await fetch("/api/tournaments/leaderboard");
    if (!response.ok) throw new Error("Failed to fetch leaderboard");

    const data = await response.json();
    useLeaderboardStore.getState().update(data.teams, data.golfers);
    return true;
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    return false;
  }
}

/**
 * Initialize the leaderboard store with current tournament data
 */
export async function initializeLeaderboardStore() {
  const currentTournament = useMainStore.getState().currentTournament;

  // Only fetch if there is a current tournament
  if (!currentTournament) {
    console.log(
      "No current tournament found, skipping leaderboard initialization",
    );
    return false;
  }

  try {
    const result = await updateLeaderboardNow();
    return result;
  } catch (error) {
    console.error("Failed to initialize leaderboard store:", error);
    return false;
  }
}
