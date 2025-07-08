import Image from "next/image";
import Link from "next/link";
import LittleFucker from "../../smartComponents/client/LittleFucker";
import type { Tournament, TourCard, Tour, Golfer } from "@prisma/client";
import { capitalize, formatScore, getPath, hasItems, isNonEmptyString } from "@/lib/utils/main";

type ChampionData = Omit<
  TourCard,
  | "createdAt"
  | "updatedAt"
  | "earnings"
  | "points"
  | "win"
  | "topTen"
  | "madeCut"
  | "appearances"
  | "seasonId"
  | "tourId"
  | "memberId"
  | "id"
> & {
  id: number;
  name: string;
  totalScore: number;
  tour: Pick<Tour, "id" | "name" | "logoUrl">;
  tourCard: Pick<TourCard, "id" | "displayName"> | null;
  golfers: Array<Pick<Golfer, "id" | "playerName" | "score" | "position">>;
};

type TournamentData = Pick<
  Tournament,
  "id" | "name" | "startDate" | "endDate" | "logoUrl"
>;

interface ChampionsPopupProps {
  tournament: TournamentData;
  champs: ChampionData[];
}

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
export function ChampionsPopup({ tournament, champs }: ChampionsPopupProps) {
  if (!tournament) return null;
  if (!hasItems(champs)) return null;
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
          <ChampionSection
            key={champ.id}
            champion={champ}
            tournament={tournament}
          />
        ))}
      </div>
    </div>
  );
}

function ChampionSection({
  champion,
  tournament,
}: {
  champion: ChampionData;
  tournament: TournamentData;
}) {
  const tourLogoUrl = getPath(champion, "tour.logoUrl") as
    | string
    | null
    | undefined;
  const tourName = getPath(champion, "tour.name") as string | undefined;
  const displayName =
    (getPath(champion, "tourCard.displayName") as string | undefined) ||
    champion.name;

  return (
    <Link
      href={`/tournament?id=${tournament.id}&tour=${champion.tour.id}`}
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
            <LittleFucker
              memberId={champion.tourCard?.id || ""}
              seasonId={tournament.id}
            />
          </div>
          <div className="text-lg font-semibold">
            {formatScore(champion.totalScore)}
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
