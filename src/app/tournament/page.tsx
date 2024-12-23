import { LeaderboardHeaderSkeleton } from "./_components/skeletons/LeaderboardHeaderSkeleton";
import LeaderboardHeader from "./_components/LeaderboardHeader";
import ToursToggle from "./_components/ToursToggle";
import { Suspense } from "react";
import { LeaderboardListSkeleton } from "./_components/skeletons/LeaderboardListSkeleton";
import TournamentCountdown from "./_components/TournamentCountdown";
import { cn, formatMoney, formatScore } from "@/src/lib/utils";
import { db } from "@/src/server/db";
import {
  teamDataInclude,
  tournamentDataInclude,
} from "@/src/types/prisma_include";
import { createClient } from "@/src/lib/supabase/server";

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<LeaderboardHeaderSkeleton />}>
        <LeaderboardHeader />
      </Suspense>
      <ToursToggle {...{ searchParams }}>
        <div className="mx-auto grid max-w-xl grid-flow-row grid-cols-10 text-center">
          <div className="col-span-2 place-self-center font-varela text-sm font-bold">
            Rank
          </div>
          <div className="col-span-4 place-self-center font-varela text-base font-bold">
            Name
          </div>
          <div className="col-span-2 place-self-center font-varela text-sm font-bold">
            Score
          </div>
          <div className="col-span-1 place-self-center font-varela text-2xs">
            Today
          </div>
          <div className="col-span-1 place-self-center font-varela text-2xs">
            Thru
          </div>
        </div>
        <Suspense fallback={<LeaderboardListSkeleton />}>
          <LeaderboardListing {...{ searchParams }} />
        </Suspense>
      </ToursToggle>
    </div>
  );
}

export async function LeaderboardListing({
  searchParams,
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const leaderboardData = await fetchLeaderboardListingInfo({
    activeTourID: searchParams?.tour,
  });
  if (!leaderboardData)
    throw new Error("Error fetching leaderboard data. LeaderboardListing:6");
  const { focusTourney, teams, toursInPlay } = leaderboardData;
  const activeTour = toursInPlay.find(
    (obj) => obj.shortForm === searchParams?.tour,
  );
  return (
    <>
      <TournamentCountdown tourney={focusTourney} />
      {teams?.map((obj) => {
        const user = obj.tourCard.memberId === data.user?.id;
        return (
          <div
            className={cn(
              "grid grid-flow-row grid-cols-10 py-1 text-center",
              user && "rounded-lg bg-gray-200 font-bold",
            )}
            key={obj.id}
          >
            <div className="col-span-2 place-self-center font-varela text-sm">
              {obj.score === 100 ? "CUT" : obj.position}
              &nbsp;&nbsp;&nbsp;{"-"}
            </div>
            <div className="col-span-4 place-self-center font-varela text-base">
              {obj.tourCard.displayName}
            </div>
            <div className="col-span-2 place-self-center font-varela text-sm">
              {formatScore(obj.score)}
              {activeTour?.shortForm}
            </div>
            <div className="col-span-1 place-self-center font-varela text-2xs">
              {focusTourney?.livePlay
                ? formatScore(obj.score)
                : obj.points === 0
                  ? "-"
                  : obj.points}
            </div>
            <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-2xs">
              {focusTourney?.livePlay
                ? obj.strokes
                : formatMoney(obj.earnings ?? 0)}
            </div>
          </div>
        );
      })}
    </>
  );
}

async function fetchLeaderboardListingInfo({
  activeTourID,
  activeTourneyID,
  seasonId,
}: {
  activeTourID?: string;
  activeTourneyID?: string;
  seasonId?: string;
}) {
  const date = new Date();
  const year = date.getFullYear();

  const season = await db.season.findUnique({ where: { year } });
  const tournaments = await db.tournament.findMany({
    where: { seasonId: seasonId ?? season?.id },
    include: tournamentDataInclude,
    orderBy: { startDate: "asc" },
  });

  const focusTourney = activeTourneyID
    ? tournaments?.find((obj) => obj.id === activeTourneyID)
    : tournaments?.find((obj) => obj.endDate < date);

  let teams = await db.team.findMany({
    where: { tournamentId: focusTourney?.id },
    include: teamDataInclude,
    orderBy: { score: "asc" },
  });
  const activeTour = focusTourney?.tours.find(
    (obj) => obj.shortForm === activeTourID,
  );
  teams = teams.filter((team) => team.tourCard.tourId === activeTour?.id);
  if (!season || !focusTourney) return null;

  const toursInPlay = [
    ...focusTourney.tours,
    {
      id: "1",
      createdAt: new Date(),
      updatedAt: new Date(),
      name: "PGA Tour",
      shortForm: "PGA",
      logoUrl: "",
      seasonId: seasonId ?? season.id,
    },
  ];

  if (!focusTourney)
    throw new Error(
      "Error fetching tournament to focus on for leaderboard list",
    );

  return { focusTourney, teams, toursInPlay };
}
