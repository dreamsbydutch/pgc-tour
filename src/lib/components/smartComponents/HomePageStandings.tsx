import Image from "next/image";
import Link from "next/link";
import { HomePageList } from "@components/HomePageList";
import { cn } from "@/lib/utils/core";
import { getCurrentStandings } from "@/server/api/actions/standings";

/**
 * Displays the standings for the homepage, showing the top players for each tour.
 * Uses the new PGC Tour Store with aggressive caching for optimal performance.
 */
export default async function HomePageStandings() {
  const tours = await getCurrentStandings();
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
        {tours?.map((tour, i) => {
          const tourTeams = tour.tourCards.slice(0, 15);
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
