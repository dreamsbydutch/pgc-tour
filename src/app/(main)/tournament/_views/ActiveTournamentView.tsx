"use client";

import { useState, useEffect } from "react";
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

  // Set up polling for live updates
  const { isPolling, refreshNow, isRefetching } = useLeaderboardPolling({
    enabled: true, // Always enabled for active tournaments
    refetchInterval: 120000, // Every 2 minutes
    onSuccess: () => {
      console.log("Leaderboard updated");
    },
    onError: (err) => console.error("Failed to update leaderboard:", err),
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
      console.error("Error during initial leaderboard load:", err)
    );
  }, []); // Empty dependency array - only run once on mount

  const handleManualRefresh = async () => {
    setIsManuallyRefreshing(true);

    if (refreshNow) {
      await refreshNow();
    } else {
      await updateLeaderboardNow();
    }

    // Add slight delay to prevent flickering
    setTimeout(() => setIsManuallyRefreshing(false), 500);
  };

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

    </>
  );
}
