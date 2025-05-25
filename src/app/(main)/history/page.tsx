"use client";

import { cn, formatMoney } from "@/src/lib/utils";
import { api } from "@/src/trpc/react";
import { Member, Team, Tier, TourCard, Tournament } from "@prisma/client";
import Image from "next/image";

export default function HistoryPage() {
  // const { data: seasons, isLoading: isSeasonLoading } =
  //   api.season.getAll.useQuery();
  const { data: tiers, isLoading: isTierLoading } = api.tier.getAll.useQuery();
  const { data: tournaments, isLoading: isTournamentLoading } =
    api.tournament.getAll.useQuery();
  const { data: members, isLoading: isMemberLoading } =
    api.member.getAll.useQuery();
  // const { data: tours, isLoading: isTourLoading } = api.tour.getAll.useQuery();
  const { data: tourCards, isLoading: isTourCardLoading } =
    api.tourCard.getAll.useQuery();
  const teams = tournaments?.map((t) => t.teams).flat();
  const golfers = tournaments?.map((t) => t.golfers).flat();
  const memberData = members?.map((obj) => {
    const memberTourCards = tourCards?.filter((tc) => tc.memberId === obj.id);
    const memberTeams = teams?.filter((team) =>
      memberTourCards?.some((tc) => tc.id === team.tourCardId),
    );

    return {
      ...obj,
      tourCards: memberTourCards,
      teams: memberTeams,
    };
  });

  return (
    <div>
      <h1 className="items-center justify-center text-center font-yellowtail text-4xl">
        All-Time Money List
      </h1>
      {memberData
        ?.sort(
          (a, b) =>
            (b.tourCards?.reduce((p, c) => (p += c.earnings), 0) ?? 0) -
            (a.tourCards?.reduce((p, c) => (p += c.earnings), 0) ?? 0),
        )
        .map((obj) => {
          const earnings = obj.tourCards?.reduce(
            (p, c) => (p += c.earnings),
            0,
          );
          return (
            <div
              key={obj.id}
              className="flex flex-row items-center justify-center gap-4"
            >
              <div className="flex flex-row items-center justify-center gap-0.5 text-lg">
                {obj.fullname}
                <HistoricalLitteFucker
                  {...{
                    teams: obj.teams ?? [],
                    tiers: tiers ?? [],
                    tournaments: tournaments ?? [],
                    tourCards: obj.tourCards,
                  }}
                />
              </div>
              <div className="text-lg">{formatMoney(earnings ?? 0)}</div>
            </div>
          );
        })}
    </div>
  );
}

function HistoricalLitteFucker({
  teams,
  tiers,
  tournaments,
  tourCards,
}: {
  teams: Team[];
  tiers: Tier[];
  tournaments: Tournament[];
  tourCards: (TourCard & { member: Member | undefined })[] | undefined;
}) {
  return teams.map((team) => {
    const tourney = tournaments.find((t) => t.id === team.tournamentId);
    const tier = tiers.find((t) => t.id === tourney?.tierId);
    const tourCard = tourCards?.find((tc) => tc.id === team.tourCardId);
    if (
      tier?.name === "Major" ||
      tourney?.name === "RBC Canadian Open" ||
      tourney?.name === "TOUR Championship"
    ) {
      if (
        (team.position === "1" || team.position === "T1") &&
        (tourCard?.playoff ?? 0) <= 1
      ) {
        return (
          <div className="flex flex-col items-center justify-center">
            <Image
              key={team.id}
              src={
                tourney?.name === "RBC Canadian Open"
                  ? "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png"
                  : tourney?.name === "TOUR Championship"
                    ? "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC"
                    : (tourney?.logoUrl ?? "")
              }
              alt="Major Champ Logo"
              width={512}
              height={512}
              className={cn(
                "mx-0.5 inline-block",
                tourney?.name === "TOUR Championship" ? "h-7 w-7" : "h-5 w-5",
              )}
            />
            <div
              className={cn(
                "font-semibold",
                tourney?.name === "TOUR Championship" ? "text-2xs" : "text-3xs",
              )}
            >
              {new Date(tourney?.startDate ?? "").getFullYear()}
            </div>
          </div>
        );
      }
    }
    return null;
  });
}
