import { HomePageList } from "./HomePageList";
import { cn } from "@pgc-utils";
import Image from "next/image";
import Link from "next/link";
import {
  transformTourCardsForStandings,
  getTourLink,
  getTourAriaLabel,
} from "../utils";
import { UI_CONSTANTS } from "../utils/constants";
import type { HomePageListingsStandingsProps } from "../utils/types";

/**
 * Displays the standings for the homepage, showing the top players for each tour.
 * Uses the new PGC Tour Store with aggressive caching for optimal performance.
 */
export default function HomePageStandings({
  tours,
  tourCards,
  self,
  champions,
}: HomePageListingsStandingsProps) {
  return (
    <div className="rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <Image
          src={"/logo512.png"}
          alt="PGC Logo"
          width={UI_CONSTANTS.LOGO_SIZE}
          height={UI_CONSTANTS.LOGO_SIZE}
          className="h-14 w-14"
        />
        <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
          Standings
        </h2>
      </div>

      <div className="grid grid-cols-2 font-varela">
        {tours?.map((tour, i) => {
          // Use the utility function to transform tour cards
          const tourTeams = transformTourCardsForStandings(tourCards, tour.id);

          return (
            <Link
              key={tour.id}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={getTourLink("standings", tour.id)}
              aria-label={getTourAriaLabel("standings", tour.shortForm)}
            >
              <HomePageList
                tour={tour}
                teams={tourTeams}
                self={self}
                champions={champions}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
