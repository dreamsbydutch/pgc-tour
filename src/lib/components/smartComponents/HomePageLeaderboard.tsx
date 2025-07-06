"use client";

import Link from "next/link";
import LeaderboardHeader from "../../../app/(main)/tournament/_components/header/LeaderboardHeader";
import { cn } from "@/lib/utils/core";
import { HomePageList, HomePageListSkeleton } from "../HomePageList";
import { useLeaderboard } from "@/lib/hooks";

export default function HomePageLeaderboard() {
  // Updated to use new consolidated hook instead of useCurrentTournamentLeaderboard
  const { tournament, teamsByTour, isLoading, error } = useLeaderboard();
  if (!tournament) return null;
  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <LeaderboardHeader focusTourney={tournament} />
      <div className="grid grid-cols-2 font-varela">
        {teamsByTour?.map((tour, i) => {
          return (
            <Link
              key={tour?.tour?.id ?? "tour-" + i}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/tournament?id=${tournament.id}&tour=${tour?.tour?.id}`}
              aria-label={`View leaderboard for ${tour?.tour?.shortForm} Tour`}
            >
              {!tour ? (
                <HomePageListSkeleton />
              ) : tour?.tour ? (
                <HomePageList tour={tour.tour} teams={tour.teams} />
              ) : (
                <HomePageListSkeleton />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
