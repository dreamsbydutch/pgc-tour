import { formatScore } from "@/old-utils";
import type { Golfer, Team, Tour, TourCard, Tournament } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import LittleFucker from "@/src/lib/components/smartComponents/LittleFucker";
import { ChampionSectionSkeleton } from "../functionalComponents/loading/ChampionsPopupSkelton";
import { getLatestChampions } from "../../actions/teamActions";

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
export default async function ChampionsPopup() {
  const { tournament, champs } = await getLatestChampions();
  if (!tournament) return null;
  if (!champs || champs?.length === 0) return <ChampionSectionSkeleton />;
  return (
    <div className="m-3 rounded-2xl bg-amber-100 bg-opacity-70 shadow-lg md:w-10/12 lg:w-7/12">
      <div className="mx-auto max-w-3xl p-2 text-center">
        <h1 className="flex items-center justify-center px-3 py-2 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          {tournament.logoUrl && (
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
        {champs.map((champ) => {
          return (
            <ChampionSection
              key={champ.id}
              champion={champ}
              tournament={tournament}
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
}: {
  champion: Team & { tour: Tour; tourCard: TourCard; golfers: Golfer[] };
  tournament: Tournament;
}) {
  return (
    <Link
      href={`/tournament?id=${tournament.id}&tour=${champion.tour.id}`}
      className="block transition-colors duration-200 hover:bg-amber-50"
    >
      <div className="mx-auto w-11/12 border-b border-slate-800" />
      <div className="py-2">
        <div className="mb-2 flex items-center justify-center gap-4">
          <Image
            alt={`${champion.tour.name || "Tour"} Logo`}
            src={champion.tour.logoUrl || ""}
            className="h-12 w-12 object-contain"
            width={128}
            height={128}
          />
          <div className="text-xl font-semibold">
            {champion.tourCard.displayName}
            <LittleFucker
              memberId={champion.tourCard.memberId}
              seasonId={tournament.seasonId}
            />
          </div>
          <div className="text-lg font-semibold">
            {formatScore(champion.score)}
          </div>
        </div>

        {/* Team golfers grid */}
        <div className="mx-4 my-1 grid grid-cols-2 items-center justify-center gap-x-4 gap-y-1">
          {champion.golfers.map((golfer) => (
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
      </div>
    </Link>
  );
}
