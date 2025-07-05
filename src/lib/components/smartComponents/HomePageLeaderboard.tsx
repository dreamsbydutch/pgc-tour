"use client";

import { cn } from "@/src/lib/utils";
import Link from "next/link";
import LeaderboardHeader from "../../../app/(main)/tournament/_components/header/LeaderboardHeader";
import {
  HomePageList,
  HomePageListSkeleton,
} from "@/src/lib/components/HomePageList";
import { useCurrentTournamentLeaderboard } from "../../hooks/useTeamsHooks";

export default function HomePageLeaderboard() {
  const {tournament,teamsByTour,dataSource,isLoading,error} = useCurrentTournamentLeaderboard()
  if (!tournament) return null;
  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <LeaderboardHeader focusTourney={tournament} />
      <div className="grid grid-cols-2 font-varela">
        {teamsByTour?.map((tour, i) => {
          return (
            <Link
              key={tour?.tour?.id ?? "tour-"+i}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/tournament?id=${tournament.id}&tour=${tour?.tour?.id}`}
              aria-label={`View leaderboard for ${tour?.tour?.shortForm} Tour`}
            >
              {!tour ? (
                <HomePageListSkeleton />
              ) : (
                tour?.tour ? (
                  <HomePageList tour={tour.tour} teams={tour.teams} />
                ) : (
                  <HomePageListSkeleton />
                )
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
