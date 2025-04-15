"use client";

import { cn, formatRank } from "@/src/lib/utils";
import { api } from "@/src/trpc/react";
import type { Member, Team, TourCard, Tournament } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import LoadingSpinner from "../../_components/LoadingSpinner";

export function StandingsTourCardInfo({
  tourCard,
  member,
}: {
  tourCard: TourCard;
  member: Member |null| undefined;
}) {
  const tourneys = (
    api.tournament.getBySeason.useQuery({
      seasonId: tourCard.seasonId,
    }).data ?? []
  ).filter((t) => t.tier.name !== "Playoff");
  const teams = api.team.getByTourCard.useQuery({
    tourCardId: tourCard.id,
  }).data;
  return (
    <div
      className={cn(
        "col-span-17 w-full border-b border-slate-300 px-2 pb-4 pt-2",
        member?.id === tourCard?.memberId &&
          "bg-gradient-to-b from-slate-200 via-slate-100 to-slate-100",
        member?.friends.includes(tourCard.memberId) &&
          "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
      )}
    >
      <div className="grid grid-flow-row grid-cols-5 pt-1.5 text-center">
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Wins
        </div>
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Top Tens
        </div>
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Cuts Made
        </div>
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Weekday Avg.
        </div>
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Weekend Avg.
        </div>
      </div>
      <div className="grid grid-flow-row grid-cols-5 pb-3 text-center">
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {tourCard.win}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {tourCard.topTen}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {tourCard.madeCut} / {tourCard.appearances}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {!teams ? (
            <LoadingSpinner className="my-0 w-3" />
          ) : (
            Math.round(
              (teams.reduce(
                (acc, team) =>
                  acc + (team.roundOne ?? 0) + (team.roundTwo ?? 0),
                0,
              ) /
                (teams.filter((a) => a.roundOne).length +
                  teams.filter((a) => a.roundTwo).length)) *
                10,
            ) / 10
          )}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {!teams ? (
            <LoadingSpinner className="w-3" />
          ) : (
            Math.round(
              (teams.reduce(
                (acc, team) =>
                  acc + (team.roundThree ?? 0) + (team.roundFour ?? 0),
                0,
              ) /
                (teams.filter((a) => a.roundThree).length +
                  teams.filter((a) => a.roundFour).length)) *
                10,
            ) / 10
          )}
        </div>
      </div>
      {(tourneys?.length ?? 0) > 10 ? (
        <>
          <TournamentHistoryRow
            {...{
              tourneys: tourneys?.slice(0, Math.round(tourneys?.length / 2)),
              teams,
              className: "border-b",
            }}
          />
          <TournamentHistoryRow
            {...{
              tourneys: tourneys?.slice(
                Math.round(tourneys?.length / 2),
                tourneys?.length,
              ),
              teams,
            }}
          />
        </>
      ) : (
        <TournamentHistoryRow
          {...{
            tourneys: tourneys,
            teams,
          }}
        />
      )}
    </div>
  );
}

function TournamentHistoryRow({
  tourneys,
  teams,
  className,
}: {
  tourneys: Tournament[] | undefined;
  teams: Team[] | undefined;
  className?: string;
}) {
  if (!tourneys || !teams) {
    return <LoadingSpinner />;
  }
  const tiers = api.tier.getBySeason.useQuery({
    seasonId: tourneys[0]?.seasonId ?? "",
  }).data;
  return (
    <div
      className={cn(
        className,
        `grid grid-flow-row grid-cols-${tourneys.length} items-end px-1 text-center [&>*:last-child]:border-none`,
      )}
    >
      {tourneys.map((obj) => {
        const tier = tiers?.find((t) => t.id === obj.tierId);
        const team = teams.find((team) => team.tournamentId === obj.id);
        return (
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center border-r border-dotted border-gray-400 font-varela text-xs sm:text-sm md:text-base",
            )}
            key={obj.id}
          >
            <div
              className={cn(
                "px-1 py-2",
                tier?.name === "Major" && "bg-champ-100",
                !team && obj.endDate < new Date() && "opacity-40",
                team?.position === "CUT" && "opacity-60",
              )}
            >
              <Link href={"/tournament/" + obj.id} className="">
                {!obj.logoUrl ? (
                  <LoadingSpinner className="w-4" />
                ) : (
                  <Image
                    width={512}
                    height={512}
                    className="w-8 xs:w-10 sm:w-12 md:w-14"
                    src={obj.logoUrl ?? ""}
                    alt={obj.name}
                  />
                )}
              </Link>
              <div
                className={cn(
                  !team && obj.endDate < new Date() && "text-red-900",
                  team?.position === "CUT" && "text-gray-600",
                  +(team?.position?.replace("T", "") ?? 0) === 1 &&
                    "font-extrabold text-champ-900",
                )}
              >
                {!teams ? (
                  <LoadingSpinner className="w-3" />
                ) : obj.endDate > new Date() ? (
                  "-"
                ) : team?.position ? (
                  team.position === "CUT" ? (
                    team.position
                  ) : (
                    <>
                      {team.position}
                      <span
                        className={cn(
                          "text-2xs",
                          +(team?.position?.replace("T", "") ?? 0) === 1 &&
                            "text-xs",
                        )}
                      >
                        {formatRank(+team.position.replace("T", "")).slice(-2)}
                      </span>
                    </>
                  )
                ) : (
                  "DNP"
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// function calcDistribution(distribution, place, tiedTotal) {
//   if (tiedTotal === 1) {
//     return distribution[place];
//   }
//   let total = 0;
//   for (let i = 0; i < tiedTotal; i++) {
//     total += +distribution[place + i];
//   }
//   return Math.round((total / tiedTotal) * 10) / 10;
// }
