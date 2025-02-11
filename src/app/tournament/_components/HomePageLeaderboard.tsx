import React from "react";
import LeaderboardHeader from "./LeaderboardHeader";
import type { TeamData, TournamentData } from "@/src/types/prisma_include";
import type { Season } from "@prisma/client";
import { api } from "@/src/trpc/server";
import { cn, formatScore } from "@/src/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default async function HomePageLeaderboard({
  tourney,
  season,
}: {
  tourney?: TournamentData;
  season?: Season;
}) {
  if (!tourney || !season) return <></>;
  const tours = await api.tour.getActive();
  const teams = await api.team.getByTournament({ tournamentId: tourney.id });
  const ccgTeams = teams
    .filter(
      (a) => a.tourCard.tourId === tours.find((b) => b.shortForm === "CCG")?.id,
    )
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 15);
  const dbydTeams = teams
    .filter(
      (a) =>
        a.tourCard.tourId === tours.find((b) => b.shortForm === "DbyD")?.id,
    )
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 15);
  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <LeaderboardHeader {...{ focusTourney: tourney, seasonId: season.id }} />
      <div className="grid grid-cols-2 font-varela">
        {[ccgTeams, dbydTeams].map((tour, i) => {
          const tourInfo = tours.find((a) => a.id === tour[0]?.tourCard.tourId);
          return (
            <Link
              key={tourInfo?.id}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={"/tournament/" + tourney.id + "?tour=" + tourInfo?.id}
            >
              <div
                className={cn(
                  "flex items-center justify-center pb-1 pt-2 text-center text-lg font-semibold",
                )}
              >
                <Image
                  alt="Tour Logo"
                  src={tourInfo?.logoUrl}
                  className="mr-2 h-8 w-8"
                />
                {tourInfo?.shortForm} Tour
              </div>
              <div className={cn("mx-1 mb-3")}>
                {tour.map((a) => (
                  <TeamListing key={a.id} {...{ team: a }} />
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

async function TeamListing({ team }: { team: TeamData }) {
  const self = await api.member.getSelf();
  return (
    <div
      className={cn(
        self?.friends.includes(team.tourCard.memberId) && "bg-slate-100",
        self?.id === team.tourCard.memberId && "bg-slate-200 font-semibold",
        "grid grid-cols-8 items-center justify-center rounded-md text-center",
      )}
    >
      <div
        className={cn(
          "col-span-1 place-self-center py-0.5 text-center text-xs",
        )}
      >
        {team.position}
      </div>
      <div
        className={cn(
          "col-span-5 place-self-center py-0.5 text-center text-sm",
        )}
      >
        {team?.tourCard.displayName}
      </div>
      <div
        className={cn(
          "col-span-2 place-self-center py-0.5 text-center text-sm",
        )}
      >
        {formatScore(team.score)}
      </div>
    </div>
  );
}
