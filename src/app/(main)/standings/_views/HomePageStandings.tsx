"use client";

import { cn } from "@/src/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useMainStore } from "@/src/lib/store/store";
import { HomePageList } from "@/src/app/_components/HomePageList";

/**
 * Displays the standings for the homepage, showing the top players for each tour.
 */
export default function HomePageStandings() {
  const tours = useMainStore((state) => state.tours);
  const tourCards = useMainStore((state) => state.tourCards);

  if (!tours?.length) return null;
  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <Image
          src={"/logo512.png"}
          alt="PGC Logo"
          width={512}
          height={512}
          className="h-14 w-14"
        />
        <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
          Standings
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
