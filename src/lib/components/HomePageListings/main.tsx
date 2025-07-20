"use client";

/**
 * HomePageListingsContainer - Main container component for home page listings
 */

import React from "react";
import { HomePageListSkeleton } from "./components/HomePageListSkeleton";
import HomePageStandings from "./components/standings";
import HomePageLeaderboard from "./components/leaderboard";
import { DEFAULT_VIEW_TYPE } from "./utils/constants";
import type { HomePageListingsViewType } from "./utils/types";
import { useLeaderboardData } from "./hooks/useLeaderboardData";
import { useStandingsData } from "./hooks/useStandingsData";

interface HomePageListingsContainerProps {
  activeView?: HomePageListingsViewType;
}

export const HomePageListingsContainer: React.FC<
  HomePageListingsContainerProps
> = ({ activeView = DEFAULT_VIEW_TYPE }) => {
  // Use the new data hooks
  const {
    data: standingsData,
    isLoading: standingsLoading,
    error: standingsError,
  } = useStandingsData();
  const { data: leaderboardData, error: leaderboardError } =
    useLeaderboardData();

  // Show loading state if data is still loading
  if (standingsLoading && activeView === "standings") {
    return (
      <div className="w-full">
        <HomePageListSkeleton />
      </div>
    );
  }

  return (
    <>
      {activeView === "standings" && (
        <>
          {standingsError && (
            <div className="py-4 text-center text-red-500">
              Error loading standings: {standingsError}
            </div>
          )}
          {standingsData && (
            <HomePageStandings
              tours={standingsData.tours}
              tourCards={standingsData.tourCards}
              self={standingsData.self}
              champions={standingsData.champions}
            />
          )}
          {!standingsData && !standingsError && (
            <div className="py-4 text-center text-gray-500">
              No standings data available
            </div>
          )}
        </>
      )}

      {activeView === "leaderboard" && (
        <>
          {leaderboardError && (
            <div className="py-4 text-center text-red-500">
              Error loading leaderboard: {leaderboardError}
            </div>
          )}
          {leaderboardData && (
            <HomePageLeaderboard
              tours={leaderboardData.tours}
              currentTournament={leaderboardData.currentTournament}
              allTournaments={leaderboardData.allTournaments}
              self={leaderboardData.self}
              champions={leaderboardData.champions}
            />
          )}
          {!leaderboardData && !leaderboardError && null}
        </>
      )}
    </>
  );
};
