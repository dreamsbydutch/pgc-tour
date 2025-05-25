"use client";

import { useMainStore } from "@/src/lib/store/store";
import { formatScore } from "@/src/lib/utils";
import type { Golfer, Team, Tournament } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import LittleFucker from "@/src/app/_components/LittleFucker";

/**
 * ChampionsPopup Component
 *
 * Displays the champions of the most recent tournament.
 * - Shows tournament logo, name, and champions from different tours
 * - Lists the players on each champion's team with their scores
 * - Provides links to the tournament leaderboard filtered by tour
 *
 * Data is fetched from the global store and API when needed.
 */
export default function ChampionsPopup() {
  const tournament = useMainStore((state) => state.pastTournaments)?.sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  )[0];

  if (
    new Date(tournament?.endDate ?? "") <
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  )
    return null;
  if (!tournament) return <ChampionSectionSkeleton />;

  const champs = tournament.teams.filter(
    (team) => team.position === "1" || team.position === "T1",
  );
  if (!champs.length) return null;

  return (
    <div className="m-3 rounded-2xl bg-amber-100 bg-opacity-70 shadow-lg md:w-10/12 lg:w-7/12">
      <div className="mx-auto max-w-3xl py-4 text-center">
        <h1 className="flex items-center justify-center px-3 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          {tournament.logoUrl && (
            <Image
              alt={`${tournament.name} Logo`}
              src={tournament.logoUrl}
              className="h-16 w-16"
              width={128}
              height={128}
            />
          )}
          {tournament.name} Champions
        </h1>

        {/* Render each champion's info */}
        {champs.map((champ) => {
          const teamGolfers = tournament.golfers.filter((golfer) =>
            champ.golferIds.includes(golfer.apiId),
          );
          return (
            <ChampionSection
              key={champ.id}
              champion={champ}
              tournament={tournament}
              golfers={teamGolfers}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * ChampionSection Component
 *
 * Displays information about a single champion:
 * - Tour logo and name
 * - Champion's name and score
 * - List of golfers on their team with scores
 *
 * @param props.champion - The champion team data
 * @param props.tournament - Tournament data
 * @param props.tourCards - List of tour cards
 * @param props.golfers - List of golfers in the tournament
 */
function ChampionSection({
  champion,
  tournament,
  golfers,
}: {
  champion: Team;
  tournament: Tournament;
  golfers: Golfer[];
}) {
  const tours = useMainStore((state) => state.tours);
  const tourCards = useMainStore((state) => state.tourCards);
  const tourCard = tourCards?.find((tc) => tc.id === champion.tourCardId);
  const tour = tours?.find((tour) => tour.id === tourCard?.tourId);

  // Filter and sort golfers on this champion's team
  const teamGolfers = golfers.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  if (!tourCard || !tour) return <ChampionSkeleton />;
  return (
    <Link
      href={`/tournament?id=${tournament.id}&tour=${tourCard?.tourId}`}
      className="block transition-colors duration-200 hover:bg-amber-50"
    >
      <div className="my-2 w-full border-b border-slate-800" />
      <div className="flex items-center justify-center gap-4">
        {tour && (
          <Image
            alt={`${tour.name || "Tour"} Logo`}
            src={tour?.logoUrl || ""}
            className="h-12 w-12"
            width={128}
            height={128}
          />
        )}
        <div className="text-xl font-semibold">
          {tourCard?.displayName}
          <LittleFucker tourCard={tourCard} />
        </div>
        <div className="text-lg font-semibold">
          {formatScore(champion.score)}
        </div>
      </div>

      {/* Team golfers grid */}
      <div className="mx-4 my-1 grid grid-cols-2 items-center justify-center gap-x-4 gap-y-1">
        {teamGolfers?.map((golfer) => (
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
    </Link>
  );
}

/**
 * ChampionSectionSkeleton Component
 *
 * Displays a loading skeleton for a single champion section
 * Mimics the structure of the ChampionSection component
 */
function ChampionSectionSkeleton() {
  return (
    <div className="m-3 rounded-2xl bg-amber-100 bg-opacity-70 shadow-lg md:w-10/12 lg:w-7/12">
      <div className="mx-auto max-w-3xl py-4 text-center">
        {/* Title skeleton */}
        <div className="flex items-center justify-center px-3 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          <div className="h-16 w-16 animate-pulse rounded-full bg-amber-200" />
          <div className="ml-2 h-10 w-48 animate-pulse rounded bg-amber-200" />
        </div>
        {/* Champion section */}{" "}
        {[0, 1].map((_obj) => (
          <ChampionSkeleton />
        ))}
      </div>
    </div>
  );
}

function ChampionSkeleton() {
  return (
    <div className="block">
      <div className="my-2 w-full border-b border-slate-800" />
      <div className="flex items-center justify-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-amber-200" />
        <div className="h-8 w-28 animate-pulse rounded bg-amber-200" />
        <div className="h-8 w-16 animate-pulse rounded bg-amber-200" />
      </div>

      {/* Team golfers skeleton grid */}
      <div className="mx-4 my-1 grid grid-cols-2 items-center justify-center gap-x-4 gap-y-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid grid-cols-9 items-center justify-center">
            <div className="col-span-7 h-4 w-full animate-pulse rounded bg-amber-200" />
            <div className="h-4 w-full" />
            <div className="h-4 w-full animate-pulse rounded bg-amber-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
