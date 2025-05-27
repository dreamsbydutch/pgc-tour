"use client";

import { useMainStore } from "@/src/lib/store/store";
import { cn, formatMoney } from "@/src/lib/utils";
import { api } from "@/src/trpc/react";
import type {
  Course,
  Golfer,
  Member,
  Team,
  Tier,
  TourCard,
  Tournament,
} from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../_components/ui/table";

type ExtendedTournament = {
  adjustedTeams?: Team[];
  teams?: Team[];
  courses?: Course[];
  golfers?: Golfer[];
  tourCards?: TourCard[];
} & Tournament;
type ExtendedTourCard = {
  teams?: (Team | undefined)[] | undefined;
  adjustedTeams?: (Team | undefined)[] | undefined;
  adjustedPoints?: number;
  adjustedEarnings?: number;
} & TourCard;

export default function HistoryPage() {
  const [showAdjusted, setShowAdjusted] = useState(false);
  // const { data: seasons, isLoading: isSeasonLoading } =
  //   api.season.getAll.useQuery();
  const currentTiers = useMainStore((state) => state.currentTiers);
  const { data: tourCards } = api.tourCard.getAll.useQuery();
  const { data: tiers } = api.tier.getAll.useQuery();
  const { data: inputTournaments } = api.tournament.getAll.useQuery();
  const { data: members } = api.member.getAll.useQuery();
  // const { data: tours, isLoading: isTourLoading } = api.tour.getAll.useQuery();
  const tournaments = (inputTournaments ?? [])
    .map((tourney: ExtendedTournament) => {
      if (
        tiers?.find((t) => t.id === tourney?.tierId)?.name === "Playoff" &&
        tourney?.name !== "TOUR Championship"
      )
        return undefined;
      const actualTier = tiers?.find((t) => t.id === tourney?.tierId);
      const comparableTier = currentTiers?.find(
        (t) => t.name === actualTier?.name,
      );
      const tourneyTourCards = tourCards?.filter(
        (obj) => obj.seasonId === tourney?.seasonId,
      );
      const tourneyTeams = updateTeamPositions(
        [...(tourney.teams ?? [])],
        tourneyTourCards,
        actualTier,
      );
      const tourneyAdjustedTeams = updateTeamPositions(
        [...(tourney.teams ?? [])],
        tourneyTourCards,
        comparableTier,
      );
      console.log(
        "Teams",
        tourneyTeams?.slice(0, 20).map((t) => ({
          earnings: t?.earnings,
          points: t?.points,
          position: t?.position,
        })),
      );
      console.log(
        "Adjusted Teams",
        tourneyAdjustedTeams?.slice(0, 20).map((t) => ({
          earnings: t?.earnings,
          points: t?.points,
          position: t?.position,
        })),
      );
      tourney.teams = tourneyTeams;
      return tourney;
    })
    .filter((t) => t !== undefined);
  const teams = tournaments?.map((t) => t.teams).flat();
  console.log(
    "Teams",
    teams?.slice(0, 20).map((t) => ({
      earnings: t?.earnings,
      points: t?.points,
      position: t?.position,
    })),
  );
  const adjustedTeams = tournaments?.map((t) => t.adjustedTeams).flat();
  console.log(
    "Adjusted Teams",
    adjustedTeams?.slice(0, 20).map((t) => ({
      earnings: t?.earnings,
      points: t?.points,
      position: t?.position,
    })),
  );
  const memberData = members?.map((obj) => {
    const memberTourCards = tourCards?.filter((tc) => tc.memberId === obj.id);
    const memberTeams = teams?.filter((t) =>
      memberTourCards?.some((tc) => tc.id === t?.tourCardId),
    );
    const memberAdjustedTeams = adjustedTeams?.filter((t) =>
      memberTourCards?.some((tc) => tc.id === t?.tourCardId),
    );

    return {
      ...obj,
      tourCards: memberTourCards?.map((tc: ExtendedTourCard) => {
        tc.adjustedPoints =
          memberAdjustedTeams?.reduce((p, c) => (p += c?.points ?? 0), 0) ?? 0;
        tc.adjustedEarnings =
          memberAdjustedTeams?.reduce((p, c) => (p += c?.earnings ?? 0), 0) ??
          0;
        return tc;
      }),
      teams: memberTeams,
      adjustedTeams: memberAdjustedTeams,
    };
  });

  return (
    <div>
      <h1 className="items-center justify-center text-center font-yellowtail text-5xl">
        All-Time Points and Money List
      </h1>

      <div className="mb-4 flex items-end justify-end">
        <label className="flex cursor-pointer items-center">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={showAdjusted}
              onChange={() => setShowAdjusted(!showAdjusted)}
            />
            <div className="peer-focus:ring-3 h-4 w-7 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-blue-300"></div>
          </div>
          <span className="mx-2 text-2xs">Adjusted</span>
        </label>
      </div>

      <Table className="mx-auto w-3/4 text-center font-varela">
        <TableHeader>
          <TableRow>
            <TableHead className="span text-center text-xs font-bold">
              Member
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              App
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Earnings
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Points
            </TableHead>
            {tournaments?.map((tourney) => {
              return (
                <TableHead
                  key={tourney.id}
                  className="text-wrap border-l text-center text-xs font-bold"
                >
                  {tourney?.name}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody className="overflow-scroll">
          {memberData
            ?.sort(
              (a, b) =>
                (b.tourCards?.reduce(
                  (p, c) =>
                    (p += showAdjusted
                      ? (c.adjustedEarnings ?? c.earnings)
                      : c.earnings),
                  0,
                ) ?? 0) -
                (a.tourCards?.reduce(
                  (p, c) =>
                    (p += showAdjusted
                      ? (c.adjustedEarnings ?? c.earnings)
                      : c.earnings),
                  0,
                ) ?? 0),
            )
            .map((obj) => {
              const earnings = obj.tourCards?.reduce(
                (p, c) => (p += c?.earnings ?? 0),
                0,
              );
              const points = obj.tourCards?.reduce(
                (p, c) => (p += c?.points ?? 0),
                0,
              );
              return (
                <TableRow key={obj.id}>
                  <TableCell className="flex flex-row items-center justify-center gap-0.5 whitespace-nowrap border-l text-center text-xs">
                    {obj.fullname}
                    <HistoricalLitteFucker
                      {...{
                        teams: (obj.teams ?? []).filter((t) => t !== undefined),
                        tiers: tiers ?? [],
                        tournaments: (tournaments ?? []).filter(
                          (t) => t !== undefined,
                        ),
                        tourCards: (obj.tourCards ?? [])
                          .filter(
                            (tc): tc is ExtendedTourCard => tc !== undefined,
                          )
                          .map((tc) => ({
                            ...tc,
                            member: members?.find((m) => m.id === tc.memberId),
                          })),
                      }}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap border-l text-center text-xs">
                    {obj.teams?.length ?? 0}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border-l text-center text-xs">
                    {formatMoney(earnings ?? 0)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border-l text-center text-xs">
                    {points?.toLocaleString() ?? 0} pts
                  </TableCell>
                  {tournaments?.map((tourney, i) => {
                    const teamData = obj.teams.find(
                      (t) => t?.tournamentId === tourney?.id,
                    );
                    const teamAdjData = obj.adjustedTeams.find(
                      (t) => t?.tournamentId === tourney?.id,
                    );
                    return (
                      <TableCell
                        key={teamData?.id ?? i}
                        className="whitespace-nowrap border-l text-center text-xs"
                      >
                        {`${formatMoney(teamData?.earnings ?? 0)} - ${formatMoney(teamAdjData?.earnings ?? 0)}`}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
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
  // Filter eligible teams (winners of major/special tournaments)
  const eligibleTeams = teams.filter((team) => {
    const tourney = tournaments.find((t) => t.id === team.tournamentId);
    const tier = tiers.find((t) => t.id === tourney?.tierId);
    const tourCard = tourCards?.find((tc) => tc.id === team.tourCardId);

    return (
      (tier?.name === "Major" ||
        tourney?.name === "RBC Canadian Open" ||
        tourney?.name === "TOUR Championship") &&
      (team.position === "1" || team.position === "T1") &&
      (tourCard?.playoff ?? 0) <= 1
    );
  });

  // Sort teams: TOUR Championship first, then Majors, then others
  const sortedTeams = eligibleTeams.sort((a, b) => {
    const tourneyA = tournaments.find((t) => t.id === a.tournamentId);
    const tourneyB = tournaments.find((t) => t.id === b.tournamentId);
    const tierA = tiers.find((t) => t.id === tourneyA?.tierId);
    const tierB = tiers.find((t) => t.id === tourneyB?.tierId);

    // TOUR Championship should be first
    if (tourneyA?.name === "TOUR Championship") return -1;
    if (tourneyB?.name === "TOUR Championship") return 1;

    // Then Majors
    if (tierA?.name === "Major" && tierB?.name !== "Major") return -1;
    if (tierA?.name !== "Major" && tierB?.name === "Major") return 1;

    // Sort by date descending (newer first)
    return (
      new Date(tourneyB?.startDate ?? "").getTime() -
      new Date(tourneyA?.startDate ?? "").getTime()
    );
  });

  return sortedTeams.map((team) => {
    const tourney = tournaments.find((t) => t.id === team.tournamentId);

    return (
      <div key={team.id} className="flex flex-col items-center justify-center">
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
  });
}

function updateTeamPositions(
  updatedTeams: Team[],
  tourCards: (TourCard & { member: Member })[] | undefined,
  tier: Tier | undefined,
) {
  return updatedTeams.map((team) => {
    const tourCard = tourCards?.find((t) => t.id === team.tourCardId);
    const sameTourTeams = updatedTeams.filter(
      (obj) =>
        tourCards?.find((a) => a.id === obj.tourCardId)?.tourId ===
        tourCard?.tourId,
    );
    // Determine current position
    const tiedCount = sameTourTeams.filter(
      (obj) =>
        (obj.score ?? 100) === (team.score ?? 100) && obj.position !== "CUT",
    ).length;
    const lowerScoreCount = sameTourTeams.filter(
      (obj) =>
        (obj.score ?? 100) < (team.score ?? 100) && obj.position !== "CUT",
    ).length;
    team.position = `${tiedCount > 1 ? "T" : ""}${lowerScoreCount + 1}`;

    // Determine past position based on (score - today)
    const tiedPastCount = sameTourTeams.filter(
      (obj) =>
        (obj.score ?? 100) - (obj.today ?? 100) ===
          (team.score ?? 100) - (team.today ?? 100) && obj.position !== "CUT",
    ).length;
    const lowerPastCount = sameTourTeams.filter(
      (obj) =>
        (obj.score ?? 100) - (obj.today ?? 100) <
          (team.score ?? 100) - (team.today ?? 100) && obj.position !== "CUT",
    ).length;
    team.pastPosition = `${tiedPastCount > 1 ? "T" : ""}${lowerPastCount + 1}`;

    if (team.position.includes("T")) {
      const tiedTeams = updatedTeams.filter(
        (obj) => obj.position === team.position,
      );
      team.points =
        (tier?.points ?? [])
          .slice(
            +team.position.replace("T", "") - 1,
            +team.position.replace("T", "") - 1 + tiedTeams.length,
          )
          .reduce((p: number, c: number) => p + c, 0) / tiedTeams.length;
      team.earnings =
        (tier?.payouts ?? [])
          .slice(
            +team.position.replace("T", "") - 1,
            +team.position.replace("T", "") - 1 + tiedTeams.length,
          )
          .reduce((p: number, c: number) => p + c, 0) / tiedTeams.length;
    } else {
      team.points = tier?.points[+team.position - 1] ?? null;
      team.earnings = tier?.payouts[+team.position - 1] ?? null;
    }
    team.points = Math.round(team.points ?? 0);
    team.earnings = Math.round((team.earnings ?? 0) * 100) / 100;

    return team;
  });
}
