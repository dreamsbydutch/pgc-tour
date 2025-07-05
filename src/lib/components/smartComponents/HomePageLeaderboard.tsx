"use client";

import { cn } from "@/src/lib/utils";
import Link from "next/link";
import LeaderboardHeader from "../../../app/(main)/tournament/_components/header/LeaderboardHeader";
import {
  HomePageList,
  HomePageListSkeleton,
} from "@/src/lib/components/HomePageList";
import { useTournamentLeaderboard } from "../../hooks/useTeamsHooks";
import {
  useCurrentTournament,
  useLastTournament,
} from "../../hooks/useTournamentHooks";

export default function HomePageLeaderboard() {
  const currentTournament = useCurrentTournament();
  const lastTournament = useLastTournament();

  // Use current tournament if available, otherwise fall back to last tournament
  const tournamentToShow = currentTournament || lastTournament;
  const isCurrentTournament = !!currentTournament;

  const { tournament, teamsByTour, dataSource, isLoading, error, status } =
    useTournamentLeaderboard(tournamentToShow?.id, {
      refreshInterval: isCurrentTournament ? 60000 : undefined, // Only refresh if current tournament
    });

  // Don't render if no tournament or error
  if (!tournamentToShow || error || status === "error") {
    return null;
  }

  console.log(teamsByTour, "Teams by Tour Data");

  // Show loading state
  if (isLoading || status === "loading") {
    return (
      <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
        <div className="animate-pulse">
          <div className="h-16 rounded-t-lg bg-gray-200"></div>
          <div className="grid grid-cols-2">
            <HomePageListSkeleton />
            <HomePageListSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no tournament data
  if (!tournament) {
    return null;
  }

  // Limit teams to first 15 for each tour
  const limitedTeamsByTour = teamsByTour?.map((tourGroup) => ({
    ...tourGroup,
    teams: tourGroup.teams.slice(0, 15), // Show first 15 teams
    teamCount: Math.min(tourGroup.teamCount, 15),
  }));

  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      {/* <LeaderboardHeader focusTourney={tournament} /> */}

      {/* Debug info for sorting issues */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-blue-100 px-2 py-1 text-xs text-blue-800">
          Data source: {dataSource} | Status: {status} | Tournament:{" "}
          {tournament.name}
        </div>
      )}

      {/* Tournament type indicator */}
      {!isCurrentTournament && (
        <div className="border-l-4 border-blue-400 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          📊 Showing results from previous tournament:{" "}
          <strong>{tournament?.name}</strong>
        </div>
      )}

      <div className="grid grid-cols-2 font-varela">
        {limitedTeamsByTour?.map((tourGroup, i) => {
          return (
            <Link
              key={tourGroup?.tour?.id ?? `tour-${i}`}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/tournament?id=${tournament.id}&tour=${tourGroup?.tour?.id}`}
              aria-label={`View leaderboard for ${tourGroup?.tour?.shortForm} Tour`}
            >
              {!tourGroup || !tourGroup.tour ? (
                <HomePageListSkeleton />
              ) : (
                <HomePageList tour={tourGroup.tour} teams={tourGroup.teams} />
              )}
            </Link>
          );
        })}

        {/* Handle case where we have fewer than 2 tours */}
        {(!limitedTeamsByTour || limitedTeamsByTour.length < 2) && (
          <div className="flex flex-col">
            <HomePageListSkeleton />
          </div>
        )}
      </div>
    </div>
  );
}
