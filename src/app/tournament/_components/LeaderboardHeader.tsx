import Image from "next/image";
import HeaderDropdown from "./HeaderDropdownMenu";
import { db } from "@/src/server/db";
import { tournamentDataInclude } from "@/src/types/prisma_include";

export default async function LeaderboardHeader({
  focusTourneyId,
  seasonId,
}: {
  focusTourneyId?: string;
  seasonId?: string;
}) {
  const date = new Date();
  const year = 2025;

  const season = await db.season.findUnique({ where: { year } });
  const tournaments = await db.tournament.findMany({
    where: { seasonId: seasonId ?? season?.id },
    include: tournamentDataInclude,
    orderBy: { startDate: "asc" },
  });

  const focusTourney = focusTourneyId
    ? tournaments?.find((obj) => obj.id === focusTourneyId)
    : tournaments?.find((obj) => obj.startDate > date);
  console.log(focusTourneyId);
  if (!focusTourney)
    throw new Error(
      "Error fetching tournament to focus on for leaderboard list",
    );
  return (
    <div
      id={`leaderboard-header-${focusTourney.id}`}
      className="mx-auto w-full md:w-11/12 lg:w-9/12"
    >
      <div className="mx-auto grid grid-flow-row grid-cols-10 border-b-2 border-gray-800 py-2">
        <div className="col-span-3 row-span-4 max-h-40 place-self-center px-1 py-2 text-center font-varela">
          {focusTourney.logoUrl && (
            <Image
              src={focusTourney.logoUrl}
              className="max-h-36"
              alt={`${focusTourney.name} logo`}
              width={150}
              height={150}
            />
          )}
        </div>
        <div className="col-span-5 row-span-2 place-self-center text-center font-varela text-xl font-bold xs:text-2xl sm:text-3xl lg:text-4xl">
          {focusTourney.name}
        </div>

        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-xs xs:text-sm sm:text-base md:text-lg">
          <HeaderDropdown activeTourney={focusTourney} {...{ seasonId }} />
        </div>
        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {`${focusTourney.startDate.toLocaleDateString("en-us", {
            month: "short",
            day: "numeric",
          })} - ${
            focusTourney.startDate.getMonth() ===
            focusTourney.endDate.getMonth()
              ? focusTourney.endDate.toLocaleDateString("en-us", {
                  day: "numeric",
                })
              : focusTourney.endDate.toLocaleDateString("en-us", {
                  month: "short",
                  day: "numeric",
                })
          }`}
        </div>
        <div className="col-span-3 row-span-1 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {focusTourney.course.name}
        </div>
        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {focusTourney.course.location}
        </div>
        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {`${focusTourney.course.front} - ${focusTourney.course.back} - ${focusTourney.course.par}`}
        </div>
        <div className="col-span-3 row-span-1 mt-2 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {focusTourney.tier.name} Tournament
        </div>
        <div className="col-span-2 row-span-1 mt-2 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {`${focusTourney.tier.points.reduce((p, c) => (p += c))} points`}
        </div>
        <div className="col-span-2 row-span-1 mt-2 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(focusTourney.tier.payouts.reduce((p, c) => (p += c)))}
        </div>
      </div>
    </div>
  );
}
