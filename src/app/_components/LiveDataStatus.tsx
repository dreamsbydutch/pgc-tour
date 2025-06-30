import { useConnection, useCurrentTournamentLive } from "@/src/lib/store";
import React from "react";

/**
 * Live Status Component - Shows real-time data status
 * This demonstrates how the new live system works
 */
export function LiveDataStatus() {
  const { isConnected } = useConnection();
  const {
    tournament,
    hasActiveTournament,
    leaderboard,
    teams,
    loading,
    error,
  } = useCurrentTournamentLive();

  if (loading) {
    return (
      <div className="rounded-lg bg-blue-50 p-4 text-blue-800">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
          <span>Checking for active tournaments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!hasActiveTournament) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          <span>No active tournament - Live updates disabled</span>
        </div>
        <p className="mt-1 text-sm">
          Only historical data is being loaded with aggressive caching.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-green-50 p-4 text-green-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          <span className="font-semibold">LIVE: {tournament?.name}</span>
        </div>
        <div className="flex items-center space-x-1 text-sm">
          <div
            className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Teams:</span> {teams.length}
        </div>
        <div>
          <span className="font-medium">Golfers:</span> {leaderboard.length}
        </div>
      </div>

      <p className="mt-2 text-xs">
        Updates every 3 minutes • Live score editing enabled
      </p>
    </div>
  );
}
