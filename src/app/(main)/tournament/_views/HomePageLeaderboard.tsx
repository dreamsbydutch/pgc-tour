"use client";

import { cn } from "@/src/lib/utils";
import Link from "next/link";
import LeaderboardHeader from "../_components/header/LeaderboardHeader";
import { useLeaderboardStore, useMainStore } from "@/src/lib/store/store";
import {
  HomePageList,
  HomePageListSkeleton,
} from "@/src/app/_components/HomePageList";

export default function HomePageLeaderboard() {
  const tourney = useMainStore((state) => state.currentTournament);
  const tours = useMainStore((state) => state.tours);
  const teams = useLeaderboardStore((state) => state.teams);
  if (!tourney) return null;

  const getTeamsForTour = (tourId: string) =>
    teams
      ?.filter((team) => team.tourCard?.tourId === tourId)
      .sort((a, b) => (a.score ?? 999) - (b.score ?? 999))
      .slice(0, 15);
  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <LeaderboardHeader focusTourney={tourney} />
      <div className="grid grid-cols-2 font-varela">
        {tours?.map((tour, i) => {
          const teams = getTeamsForTour(tour.id);
          return (
            <Link
              key={tour.id}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/tournament?id=${tourney.id}&tour=${tour.id}`}
              aria-label={`View leaderboard for ${tour.shortForm} Tour`}
            >
              {!teams ? (
                <HomePageListSkeleton />
              ) : (
                <HomePageList tour={tour} teams={teams} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
