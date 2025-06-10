import { useQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { useLeaderboardStore } from "../domains/leaderboard/store";
import { leaderboardService } from "../services/leaderboard.service";

export function useLeaderboardData(tournamentId?: string) {
  const store = useLeaderboardStore();

  // Query for leaderboard data
  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", tournamentId],
    queryFn: () => leaderboardService.getLeaderboard(tournamentId!),
    enabled: !!tournamentId,
    staleTime: 2 * 60 * 1000, // 2 minutes for leaderboard data
    refetchInterval: (data) => {
      // Auto-refresh every 3 minutes if tournament is active
      if (!data?.metadata?.playComplete) {
        return 3 * 60 * 1000;
      }
      return false;
    },
  });

  // Sync with store when data changes
  useEffect(() => {
    if (leaderboardQuery.data && tournamentId) {
      store.setLeaderboard(tournamentId, leaderboardQuery.data);
    }
  }, [leaderboardQuery.data, tournamentId, store]);

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    return leaderboardQuery.refetch();
  }, [leaderboardQuery.refetch]);

  return {
    leaderboard: tournamentId ? store.leaderboards.get(tournamentId) : null,
    teams: store.currentLeaderboard?.teams || [],
    golfers: store.currentLeaderboard?.golfers || [],
    lastUpdated: tournamentId ? store.lastUpdated.get(tournamentId) : null,
    isLoading: leaderboardQuery.isLoading,
    isPolling: store.isPolling,
    error: leaderboardQuery.error || store.error,
    refetch: leaderboardQuery.refetch,
    manualRefresh,
  };
}

export function useLeaderboardUpdates(tournamentId: string) {
  const store = useLeaderboardStore();

  // Start/stop polling based on tournament activity
  useEffect(() => {
    if (tournamentId) {
      store.startPolling(tournamentId);

      return () => {
        store.stopPolling();
      };
    }
  }, [tournamentId, store]);

  return useLeaderboardData(tournamentId);
}
