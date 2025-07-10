import Image from "next/image";
import Link from "next/link";
import {
  capitalize,
  formatScore,
  hasItems,
  isNonEmptyString,
} from "@utils/main";
import { LittleFucker } from "@components/index";

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
export function ChampionsPopup({
  champs,
}: {
  champs: {
    id: number;
    displayName: string;
    score: number;
    tournament: {
      id: string;
      name: string;
      logoUrl: string | null;
      startDate: Date;
    };
    tour: { id: string; name: string; logoUrl: string | null };
    golfers: {
      id: number;
      position: string;
      playerName: string;
      score: number;
    }[];
  }[];
}) {
  const tournament = champs?.[0]?.tournament;
  if (!hasItems(champs) || !tournament) return null;
  return (
    <div className="m-3 rounded-2xl bg-amber-100 bg-opacity-70 shadow-lg md:w-10/12 lg:w-7/12">
      <div className="mx-auto max-w-3xl p-2 text-center">
        <h1 className="flex items-center justify-center px-3 py-2 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          {isNonEmptyString(tournament.logoUrl) && (
            <Image
              alt={`${tournament.name} Logo`}
              src={tournament.logoUrl}
              className="h-24 w-24 object-contain"
              width={128}
              height={128}
            />
          )}
          {tournament.name} Champions
        </h1>
        {/* Render each champion's info */}
        {champs.map((champ) => (
          <ChampionSection key={champ.id} champion={champ} />
        ))}
      </div>
    </div>
  );
}

function ChampionSection({
  champion,
}: {
  champion: {
    id: number;
    displayName: string;
    score: number;
    tournament: {
      id: string;
      name: string;
      logoUrl: string | null;
      startDate: Date;
    };
    tour: { id: string; name: string; logoUrl: string | null };
    golfers: {
      id: number;
      position: string;
      playerName: string;
      score: number;
    }[];
  };
}) {
  const tourLogoUrl = champion.tour.logoUrl;
  const tourName = champion.tour.name;
  const displayName = champion.displayName;

  return (
    <Link
      href={`/tournament?id=${champion.tournament.id}&tour=${champion.tour.id}`}
      className="block transition-colors duration-200 hover:bg-amber-50"
    >
      <div className="mx-auto w-11/12 border-b border-slate-800" />
      <div className="py-2">
        <div className="mb-2 flex items-center justify-center gap-4">
          {isNonEmptyString(tourLogoUrl) && (
            <Image
              alt={`${tourName || "Tour"} Logo`}
              src={tourLogoUrl}
              className="h-12 w-12 object-contain"
              width={128}
              height={128}
            />
          )}
          <div className="text-xl font-semibold">
            {capitalize(displayName)}
            {champion && (
              <LittleFucker champions={[champion]} showSeasonText={false} />
            )}
          </div>
          <div className="text-lg font-semibold">
            {formatScore(champion.score)}
          </div>
        </div>
        {/* Team golfers grid */}
        <div className="mx-4 my-1 grid grid-cols-2 items-center justify-center gap-x-4 gap-y-1">
          {hasItems(champion.golfers) &&
            champion.golfers.map((golfer) => (
              <div
                key={golfer.id}
                className="grid grid-cols-8 items-center justify-center"
              >
                <div className="col-span-1 text-xs">{golfer.position}</div>
                <div className="col-span-6 text-xs">{golfer.playerName}</div>
                <div className="text-xs">
                  {["CUT", "WD", "DQ"].includes(golfer.position ?? "")
                    ? golfer.position
                    : formatScore(golfer.score)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </Link>
  );
}
