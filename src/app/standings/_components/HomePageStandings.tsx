import { cn } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import { TourCardData, TournamentData } from "@/src/types/prisma_include";
import { Season } from "@prisma/client";
import Link from "next/link";

export default async function HomePageStandings({
  season,
}: {
  season?: Season;
}) {
  const tourCards = await api.tourCard.getBySeasonId({ seasonId: season?.id });
  const ccgTourCards = tourCards
    ?.filter((a) => a.tour.shortForm === "CCG")
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 15);
  const dbydTourCards = tourCards
    ?.filter((a) => a.tour.shortForm === "DbyD")
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 15);
  return (
    <div className="mx-1 mt-8 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="mb-4 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        Tour Standings
      </div>
      <div className="grid grid-cols-2 font-varela">
        {[ccgTourCards, dbydTourCards].map((tourCard, i) => {
          if (!tourCard) return <></>;
          return (
            <Link
              key={tourCard[0]?.tourId}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={"/standings?tour=" + tourCard[0]?.tourId}
            >
              <div
                className={cn(
                  "flex items-center justify-center pb-1 pt-2 text-center text-lg font-semibold",
                )}
              >
                <img src={tourCard[0]?.tour.logoUrl} className="mr-2 h-8 w-8" />
                {tourCard[0]?.tour.shortForm} Tour
              </div>
              <div className={cn("mx-1 mb-3")}>
                {tourCard.map((a) => (
                  <TeamListing key={a.id} {...{ tourCard: a }} />
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

async function TeamListing({ tourCard }: { tourCard: TourCardData }) {
  const self = await api.member.getSelf();
  return (
    <div
      className={cn(
        self?.friends.includes(tourCard.memberId) && "bg-slate-100",
        self?.id === tourCard.memberId && "bg-slate-200 font-semibold",
        "grid grid-cols-8 items-center justify-center rounded-md text-center",
      )}
    >
      <div
        className={cn(
          "col-span-1 place-self-center py-0.5 text-center text-xs",
        )}
      >
        {tourCard.position}
      </div>
      <div
        className={cn(
          "col-span-5 place-self-center py-0.5 text-center text-sm",
        )}
      >
        {tourCard.displayName}
      </div>
      <div
        className={cn(
          "col-span-2 place-self-center py-0.5 text-center text-sm",
        )}
      >
        {tourCard.points}
      </div>
    </div>
  );
}
