"use client";

import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { api } from "@/src/trpc/react";
import { HomePageList } from "@/src/app/_components/HomePageList";

/**
 * Displays the standings for the homepage, showing the top players for each tour.
 */
export default function HomePageStandings() {
  // Get current season for tours data
  const { data: currentSeason } = api.season.getCurrent.useQuery();

  // Get tours for current season
  const { data: tours } = api.tour.getBySeason.useQuery(
    {
      seasonID: currentSeason?.id,
    },
    {
      enabled: !!currentSeason?.id,
    },
  );

  // Get tour cards for current season
  const { data: tourCards } = api.tourCard.getBySeason.useQuery(
    {
      seasonId: currentSeason?.id ?? "",
    },
    {
      enabled: !!currentSeason?.id,
    },
  );

  if (!tours?.length) return null;
  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
          PGC Standings
        </h2>
      </div>

      <div className="grid grid-cols-2 font-varela">
        {tours.map((tour, i) => {
          const tourTeams = tourCards
            ?.sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
            .filter((obj) => obj.tourId === tour.id)
            .slice(0, 15);
          if (!tourTeams?.length) return null;
          return (
            <Link
              key={tour.id}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/standings?tour=${tour.id}`}
              aria-label={`View standings for ${tour.shortForm} Tour`}
            >
              <HomePageList tour={tour} teams={tourTeams} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
