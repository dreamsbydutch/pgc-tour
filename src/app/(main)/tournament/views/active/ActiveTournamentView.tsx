"use client";

import { useState, useEffect, useCallback } from "react";
import { useLeaderboardData } from "@/src/lib/store/hooks/useLeaderboardData";
import LeaderboardPage from "../shared/LeaderboardPage";
import type { Course, Tournament } from "@prisma/client";

interface ActiveTournamentViewProps {
  tournament: Tournament & { course: Course | null };
  inputTour: string;
}

export default function ActiveTournamentView({
  tournament,
  inputTour,
}: ActiveTournamentViewProps) {
  // Use the new leaderboard data hook
  const { lastUpdated, isPolling, isLoading, manualRefresh, error } =
    useLeaderboardData(tournament.id);

  // Manual refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh function
  const refreshNow = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await manualRefresh();
      console.log("✅ Manual leaderboard refresh completed");
    } catch (err) {
      console.error("❌ Manual leaderboard refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [manualRefresh]);
  // Load initial data on component mount if needed
  useEffect(() => {
    const initialLoad = async () => {
      // Only load if data is stale (older than 5 minutes) or missing
      const lastUpdateTimestamp = lastUpdated ? lastUpdated.getTime() : 0;
      if (!lastUpdated || Date.now() - lastUpdateTimestamp > 300000) {
        console.log("🔄 Loading initial leaderboard data...");
        await refreshNow();
      }
    };

    initialLoad().catch((err) =>
      console.error("❌ Initial leaderboard load failed:", err),
    );
  }, [refreshNow, lastUpdated]); // Run once on mount

  // Log polling status for debugging
  useEffect(() => {
    if (isPolling) {
      console.log("📊 Leaderboard polling is active");
    } else {
      console.log("📊 Leaderboard polling is inactive");
    }
  }, [isPolling]);

  const handleManualRefresh = useCallback(async () => {
    await refreshNow();
  }, [refreshNow]);
  // Format the last updated time as a readable string
  const formatLastUpdated = (timestamp: Date | null) => {
    if (!timestamp) return "Never";

    const date = timestamp;

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
  const showLoading = isRefreshing;

  return (
    <>
      {/* Status bar for live tournaments */}
      <div className="mx-auto my-0.5 flex w-full max-w-4xl items-center justify-between gap-4 md:w-11/12 lg:w-8/12">
        <div className="flex flex-row">
          <span className="text-2xs text-slate-500">
            {lastUpdated
              ? `Last updated: ${formatLastUpdated(lastUpdated)}`
              : "Updating..."}
          </span>
        </div>

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
