"use client";

import React from "react";
import { useTeams, useHistoricalTeams } from "@/src/lib/store/hooks";

/**
 * Demo component to show the new team data structure with current season focus
 */
export function TeamDataStatus() {
  const {
    teams: currentSeasonTeams,
    loading: currentLoading,
    error: currentError,
    season,
  } = useTeams();

  const {
    teams: historicalTeams,
    loading: historicalLoading,
    error: historicalError,
  } = useHistoricalTeams();

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Team Data Status</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-green-600">
            🏌️ Current Season Teams ({season?.number ?? "Loading..."})
          </h4>
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            {currentLoading ? "Loading..." : currentError ? "Error" : "Loaded"}
          </p>
          <p className="text-sm">
            Teams: {currentSeasonTeams.length} from current season
          </p>
          {currentError && (
            <p className="text-sm text-red-600">Error: {currentError}</p>
          )}
        </div>

        <div>
          <h4 className="font-medium text-blue-600">
            📚 Historical Teams (All Seasons)
          </h4>
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            {historicalLoading
              ? "Loading..."
              : historicalError
                ? "Error"
                : "Loaded"}
          </p>
          <p className="text-sm">
            Teams: {historicalTeams.length} across all seasons
          </p>
          {historicalError && (
            <p className="text-sm text-red-600">Error: {historicalError}</p>
          )}
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>💡 Most components should use current season teams by default</p>
          <p>
            🔍 Historical data is available for analysis but loads more data
          </p>
        </div>
      </div>
    </div>
  );
}
