"use server";

import { cn, formatMoney, formatScore } from "@/src/lib/utils";
import { db } from "@/src/server/db";
import {
  teamDataInclude,
  tournamentDataInclude,
} from "@/src/types/prisma_include";
import TournamentCountdown from "./TournamentCountdown";
import { createClient } from "@/src/lib/supabase/server";

export async function LeaderboardListing({
  tournamentId,
  searchParams,
}: {
  tournamentId?: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const leaderboardData = await fetchLeaderboardListingInfo({
    activeTourID: searchParams?.tour,
    activeTourneyID: tournamentId,
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
  const year = 2025;

  const season = await db.season.findUnique({ where: { year } });
  const tournaments = await db.tournament.findMany({
    where: { seasonId: seasonId ?? season?.id },
    include: tournamentDataInclude,
    orderBy: { startDate: "asc" },
  });

  const focusTourney = activeTourneyID
    ? tournaments?.find((obj) => obj.id === activeTourneyID)
    : tournaments?.find((obj) => obj.startDate > date);

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
