"use client";

import { cn } from "@/src/lib/utils";
import Link from "next/link";
import LeaderboardHeader from "../../../app/(main)/tournament/_components/header/LeaderboardHeader";
import {
  HomePageList,
  HomePageListSkeleton,
} from "@/src/lib/components/HomePageList";
import { useCurrentLeaderboard } from "../../hooks/useTeamsHooks";

export default function HomePageLeaderboard() {
  const {tourney,teamsByTour} = useCurrentLeaderboard()
  if (!tourney) return null;
  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <LeaderboardHeader focusTourney={tourney} />
      <div className="grid grid-cols-2 font-varela">
        {teamsByTour?.map((tour, i) => {
          return (
            <Link
              key={tour?.[0]?.tour?.id ?? "tour-"+i}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/tournament?id=${tourney.id}&tour=${tour?.[0]?.tour?.id}`}
              aria-label={`View leaderboard for ${tour?.[0]?.tour?.shortForm} Tour`}
            >
              {!tour ? (
                <HomePageListSkeleton />
              ) : (
                tour?.[0]?.tour ? (
                  <HomePageList tour={tour[0].tour} teams={tour} />
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
