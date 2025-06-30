"use client";

import { cn } from "@/src/lib/utils";
import Image from "next/image";
import Link from "next/link";
<<<<<<< Updated upstream:src/app/(main)/standings/_views/HomePageStandings.tsx
import { useMainStore } from "@/src/lib/store/store";
=======
>>>>>>> Stashed changes:src/app/(main)/standings/views/shared/HomePageStandings.tsx
import { HomePageList } from "@/src/app/_components/HomePageList";
import {
  useCurrentSeason,
  useTours,
  useTourCards,
  type Tour,
  type TourCard,
} from "@/src/lib/store";

/**
 * Displays the standings for the homepage, showing the top players for each tour.
 * Uses the new PGC Tour Store with aggressive caching for optimal performance.
 */
export default function HomePageStandings() {
<<<<<<< Updated upstream:src/app/(main)/standings/_views/HomePageStandings.tsx
  const tours = useMainStore((state) => state.tours);
  const tourCards = useMainStore((state) => state.tourCards);
=======
  // Get data from store hooks (with aggressive caching)
  const { season: currentSeason, loading: seasonLoading } = useCurrentSeason();
  const { tours, loading: toursLoading } = useTours();
  const { tourCards, loading: tourCardsLoading } = useTourCards();

  // Filter tours by current season
  const currentSeasonTours = tours.filter(
    (tour: Tour) => tour.seasonId === currentSeason?.id,
  );

  // Filter tour cards by current season
  const currentSeasonTourCards = tourCards.filter(
    (tourCard: TourCard) => tourCard.seasonId === currentSeason?.id,
  );
>>>>>>> Stashed changes:src/app/(main)/standings/views/shared/HomePageStandings.tsx

  // Show loading state
  if (seasonLoading || toursLoading || tourCardsLoading) {
    return (
      <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
        <div className="my-3 flex items-center justify-center gap-3">
          <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
            PGC Standings
          </h2>
        </div>
        <div className="grid grid-cols-2 font-varela">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading standings...</div>
          </div>
        </div>
      </div>
    );
  }
  // Early return if no tours available
  if (!currentSeasonTours?.length) return null;

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
        {currentSeasonTours.map((tour: Tour, i: number) => {
          const tourTeams = currentSeasonTourCards
            ?.sort(
              (a: TourCard, b: TourCard) => (b.points ?? 0) - (a.points ?? 0),
            )
            .filter((obj: TourCard) => obj.tourId === tour.id)
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
