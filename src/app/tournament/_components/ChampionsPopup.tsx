"use client";

import { formatScore } from "@/src/lib/utils";
import { api } from "@/src/trpc/react";
import { TeamData, TourData, TournamentData } from "@/src/types/prisma_include";
import { Golfer } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

/**
 * ChampionsPopup Component
 *
 * Displays the champions of the most recent tournament.
 * - Shows the tournament name, logo, and champions' details.
 * - Includes links to the leaderboard for each champion's tour.
 *
 * Fetches:
 * - Recent tournament data.
 * - Tour cards for the season.
 * - Teams and golfers for the tournament.
 */
export default function ChampionsPopup({
  tournament,
  tours,
}: {
  tournament: TournamentData;
  tours: TourData[];
}) {
  const teams = api.team.getByTournament.useQuery({
    tournamentId: tournament.id,
  }).data;
  // Filter teams to get champions (position "1" or "T1")
  const champs = tours.map((tour) =>
    teams?.filter(
      (team) =>
        tour.id === team.tourCard.tourId &&
        (team.position === "1" || team.position === "T1"),
    ),
  ).sort((a, b) => (a?.[0]?.score ?? 0) - (b?.[0]?.score ?? 0));

  return (
    <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-amber-100 bg-opacity-70 p-2 shadow-lg md:w-10/12 lg:w-7/12">
      <div className="py-4 text-center">
        <h1 className="flex items-center justify-center px-3 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          <Image
            alt="Tourney Logo"
            src={tournament?.logoUrl ?? ""}
            className="h-16 w-16"
            width={128}
            height={128}
          />
          {tournament?.name} Champions
        </h1>
        {tournament &&
          champs?.map((tourChamps) =>
            tourChamps?.map((champ) => (
              <ChampionCard
                key={champ.tourCardId}
                champ={champ}
                tournament={tournament}
                tour={tours.find((t) => t.id === champ.tourCard.tourId)}
              />
            )),
          )}
      </div>
    </div>
  );
}

/**
 * ChampionCard Component
 *
 * Displays details for a single champion.
 * - Includes the champion's name, score, and golfers in their team.
 * - Links to the leaderboard for the champion's tour.
 *
 * Props:
 * - champ: The champion team data.
 * - tournament: The tournament data.
 * - tourCards: The list of tour cards for the season.
 * - golfers: The list of golfers in the tournament.
 */
function ChampionCard({
  champ,
  tournament,
  tour,
}: {
  champ: TeamData;
  tournament: TournamentData;
  tour: TourData | undefined;
}) {
  return (
    <Link
      href={`/tournament/${tournament?.id}?tour=${champ.tourCard.tourId}`}
      className="block"
    >
      <div className="my-2 w-full border-b border-slate-800" />
      <div className="flex items-center justify-center gap-4">
        <Image
          alt="Tour Logo"
          src={tour?.logoUrl ?? ""}
          className="h-12 w-12"
          width={128}
          height={128}
        />
        <div className="text-xl font-semibold">
          {champ?.tourCard.displayName}
        </div>
        <div className="text-lg font-semibold">{champ?.score}</div>
      </div>
      <ChampionGolfers golfers={tournament.golfers} champ={champ} />
    </Link>
  );
}

/**
 * ChampionGolfers Component
 *
 * Displays the golfers in a champion's team.
 * - Shows each golfer's name and score.
 * - Sorts golfers by their scores.
 *
 * Props:
 * - golfers: The list of golfers in the tournament.
 * - champ: The champion team data.
 */
function ChampionGolfers({
  golfers,
  champ,
}: {
  golfers: Golfer[];
  champ: TeamData;
}) {
  const teamGolfers = golfers
    .filter((golfer) => champ?.golferIds.includes(golfer.apiId))
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  return (
    <div className="my-1 grid grid-cols-2 items-center justify-center gap-1">
      {teamGolfers.map((golfer) => (
        <div
          key={golfer.id}
          className="grid grid-cols-7 items-center justify-center"
        >
          <div className="col-span-6 text-xs">{golfer.playerName}</div>
          <div className="text-xs">
            {["CUT", "WD", "DQ"].includes(golfer.position ?? "")
              ? golfer.position
              : formatScore(golfer.score)}
          </div>
        </div>
      ))}
    </div>
  );
}
