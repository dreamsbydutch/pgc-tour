import Image from "next/image";
import Link from "next/link";
import { cn } from "@pgc-utils";
import { HomePageList } from "@pgc-components";

/**
 * Displays the standings for the homepage, showing the top players for each tour.
 * Uses the new PGC Tour Store with aggressive caching for optimal performance.
 */
export default function HomePageStandings({
  tours,
  tourCards,
  self,
  champions,
}: {
  tours: { id: string; logoUrl: string | null; shortForm: string }[];
  tourCards: {
    id: string;
    tourId: string;
    points: number;
    earnings: number;
    position: string;
    displayName: string;
    memberId: string;
  }[];
  self: { id: string; friends: string[] };
  champions?:
    | {
        id: number;
        tournament: {
          name: string;
          logoUrl: string | null;
          startDate: Date;
        };
      }[]
    | null;
}) {
  return (
    <div className="rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
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
          // Map tourTeams to include stat fields
          const tourCard = tourCards
            .filter((tc) => tc.tourId === tour.id)
            .sort((a, b) => b.points - a.points);
          const tourTeams = tourCard?.slice(0, 15).map((team) => ({
            ...team,
            mainStat: team.points,
            secondaryStat: team.earnings,
          }));
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
              <HomePageList
                tour={tour}
                teams={tourTeams}
                self={self}
                // champions={champions}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
