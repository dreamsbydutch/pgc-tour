"use server";

import { cn, formatMoney, formatScore } from "@/src/lib/utils";
import { createClient } from "@/src/lib/supabase/server";
import { api } from "@/src/trpc/server";
import { Golfer, Tournament } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { PGAListing } from "./LeaderboardListItem";

export async function LeaderboardListing({
  tournament,
  searchParams,
}: {
  tournament: Tournament;
  searchParams?: Record<string, string | undefined>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const leaderboardData = await fetchLeaderboardListingInfo({
    activeTourID: searchParams?.tour,
    tournament,
  });
  if (!leaderboardData)
    throw new Error("Error fetching leaderboard data. LeaderboardListing:27");
  const { golfers, teams, toursInPlay } = leaderboardData;
  const activeTour = toursInPlay.find(
    (obj) => obj.shortForm === searchParams?.tour,
  );
  return (
    <>
      {activeTour?.shortForm === "PGA"
        ? golfers
            .sort(
              (a, b) =>
                (a.position === "DQ"
                  ? 999 + (a.score ?? 999)
                  : a.position === "WD"
                    ? 888 + (a.score ?? 999)
                    : a.position === "CUT"
                      ? 444 + (a.score ?? 999)
                      : (a.score ?? 999)) -
                (b.position === "DQ"
                  ? 999 + (b.score ?? 999)
                  : b.position === "WD"
                    ? 888 + (b.score ?? 999)
                    : b.position === "CUT"
                      ? 444 + (b.score ?? 999)
                      : (b.score ?? 999)),
            )
            .map((obj) => <PGAListing {...{ golfer: obj }} />)
        : teams?.map((obj) => {
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
                  {tournament?.livePlay
                    ? formatScore(obj.score)
                    : obj.points === 0
                      ? "-"
                      : obj.points}
                </div>
                <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-2xs">
                  {tournament?.livePlay
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
  tournament,
  activeTourID,
  seasonId,
}: {
  tournament: Tournament;
  activeTourID?: string;
  seasonId?: string;
}) {
  const date = new Date();
  const year = 2025;

  const season = await api.season.getByYear({ year });

  let teams = await api.team.getByTournament({
    tournamentId: tournament.id,
  });
  const tours = await api.tour.getBySeason({ seasonID: season?.id });
  const golfers = await api.golfer.getByTournament({
    tournamentId: tournament.id,
  });
  const activeTour = tours.find((obj) => obj.shortForm === activeTourID);
  teams = teams.filter((team) => team.tourCard.tourId === activeTour?.id);
  if (!season) return null;

  const toursInPlay = [
    ...tours,
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

  return { golfers, teams, toursInPlay };
}
