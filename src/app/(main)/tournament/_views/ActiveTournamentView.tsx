"use client";

import { useState, useEffect, useCallback } from "react";
import { useLeaderboardStore } from "@/src/lib/store/store";
import {
  updateLeaderboardNow,
  useLeaderboardPolling,
} from "@/src/lib/store/leaderboardInit";
import LeaderboardPage from "./LeaderboardPage";
import type { Course, Tournament } from "@prisma/client";

interface ActiveTournamentViewProps {
  tournament: Tournament & { course: Course | null };
  inputTour: string;
}

export default function ActiveTournamentView({
  tournament,
  inputTour,
}: ActiveTournamentViewProps) {
  const lastUpdated = useLeaderboardStore((state) => state._lastUpdated);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);

  // Memoize callbacks to prevent infinite re-renders
  const onSuccess = useCallback(() => {
    console.log("Leaderboard updated");
  }, []);

  const onError = useCallback((err: Error) => {
    console.error("Failed to update leaderboard:", err);
  }, []);
  // Set up polling for live updates - only when tournament is live
  const { isPolling, refreshNow, isRefetching } = useLeaderboardPolling({
    enabled: tournament.livePlay === true, // Only poll when tournament is actively live
    refetchInterval: 120000, // Every 2 minutes
    onSuccess,
    onError,
  });

  // Load initial data on component mount
  useEffect(() => {
    const initialLoad = async () => {
      const currentLastUpdated = useLeaderboardStore.getState()._lastUpdated;
      if (!currentLastUpdated || Date.now() - currentLastUpdated > 300000) {
        setIsManuallyRefreshing(true);
        await updateLeaderboardNow();
        setIsManuallyRefreshing(false);
      }
    };

    initialLoad().catch((err) =>
      console.error("Error during initial leaderboard load:", err),
    );
  }, []); // Empty dependency array - only run once on mount

  const handleManualRefresh = useCallback(async () => {
    setIsManuallyRefreshing(true);

    if (refreshNow) {
      await refreshNow();
    } else {
      await updateLeaderboardNow();
    }

    // Add slight delay to prevent flickering
    setTimeout(() => setIsManuallyRefreshing(false), 500);
  }, [refreshNow]);

  // Format the last updated time as a readable string
  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) return "Never";

    const date = new Date(timestamp);

    // For today's dates, show just the time
    if (date.toDateString() === new Date().toDateString()) {
      return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // For other dates, show date and time
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Combine all loading states to show the refresh indicator
  const showLoading = isRefetching || isManuallyRefreshing;
  return (
    <>
      {/* Status bar for live tournaments */}
      <div className="mx-auto my-0.5 flex w-full max-w-4xl items-center justify-between gap-4 md:w-11/12 lg:w-8/12">
        <span className="text-2xs text-slate-500">
          {lastUpdated
            ? `Last updated: ${formatLastUpdated(lastUpdated)}`
            : "Updating..."}
        </span>

        <div className="flex items-center gap-2">
          <button
            className="border-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 shadow-md"
            onClick={handleManualRefresh}
            disabled={showLoading}
          >
            {showLoading ? "Refreshing..." : "Refresh"}
          </button>

          <span className="badge text-2xs text-slate-500">
            {tournament.livePlay
              ? `Round ${tournament.currentRound} - ${isPolling ? "Live" : "Not Updating"}`
              : `Round ${(tournament.currentRound ?? 1) - 1} - Complete`}
          </span>
        </div>
      </div>

      {/* The actual leaderboard */}
      <LeaderboardPage tournament={tournament} inputTour={inputTour} />
    </>
  );
}
