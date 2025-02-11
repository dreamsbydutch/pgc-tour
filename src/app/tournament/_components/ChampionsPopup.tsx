import { formatScore } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import Image from "next/image";
import Link from "next/link";

export default async function ChampionsPopup() {
  const tournament = await api.tournament.getRecent();
  const tourCards = await api.tourCard.getBySeasonId({
    seasonId: tournament?.seasonId,
  });
  const teams = await api.team.getByTournament({
    tournamentId: tournament?.id,
  });
  const golfers = await api.golfer.getByTournament({
    tournamentId: tournament?.id ?? "",
  });
  const champs = teams.filter((a) => a.position === "1" || a.position === "T1");
  return (
    <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-amber-100 bg-opacity-70 p-2 shadow-lg md:w-10/12 lg:w-7/12">
      <div className="py-4 text-center">
        <h1 className="flex px-3 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          <Image
            alt="Tourney Logo"
            src={tournament?.logoUrl ?? ""}
            className="h-16 w-16"
          />
          {tournament?.name} Champions
        </h1>
        {champs.map((champ) => (
          <Link
            key={champ.tourCardId}
            href={`/tournament/${tournament?.id}?tour=${champ.tourCard.tourId}`}
          >
            <div className="my-2 w-full border-b border-slate-800" />
            <div className="flex items-center justify-center gap-4">
              <Image
                alt="Tour Logo"
                src={
                  tourCards?.find((a) => a.id === champ?.tourCardId)?.tour
                    .logoUrl
                }
                className="h-12 w-12"
              />
              <div className="text-xl font-semibold">
                {champ?.tourCard.displayName}
              </div>
              <div className="text-lg font-semibold">{champ?.score}</div>
            </div>
            <div className="my-1 grid grid-cols-2 items-center justify-center gap-1">
              {golfers
                .filter((a) => champ?.golferIds.includes(a.apiId))
                .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
                .map((golfer) => (
                  <div
                    key={golfer.id}
                    className="grid grid-cols-7 items-center justify-center"
                  >
                    <div className="col-span-6 text-xs">
                      {golfer.playerName}
                    </div>
                    <div className="text-xs">
                      {golfer.position === "CUT" ||
                      golfer.position === "WD" ||
                      golfer.position === "DQ"
                        ? golfer.position
                        : formatScore(golfer.score)}
                    </div>
                  </div>
                ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
