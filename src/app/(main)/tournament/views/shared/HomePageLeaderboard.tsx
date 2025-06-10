"use client";

import { cn } from "@/src/lib/utils";
import Link from "next/link";
import LeaderboardHeader from "../../components/header/LeaderboardHeader";
import { useTournamentData } from "@/src/lib/store/hooks/useTournamentData";
import { useLeaderboardData } from "@/src/lib/store/hooks/useLeaderboardData";
import {
  HomePageList,
  HomePageListSkeleton,
} from "@/src/app/_components/HomePageList";
import { api } from "@/src/trpc/react";

export default function HomePageLeaderboard() {
  const { currentTournament: tourney } = useTournamentData();
  const { teams } = useLeaderboardData(tourney?.id);

  // Get tours data using API for now (TODO: move to store hooks when available)
  const toursQuery = api.tour.getBySeason.useQuery({
    seasonID: tourney?.seasonId ?? "",
  });
  const tours = toursQuery.data;

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
