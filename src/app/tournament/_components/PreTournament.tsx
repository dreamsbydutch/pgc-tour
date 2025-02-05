"use client";

import TournamentCountdown from "./TournamentCountdown";
import type { TourCardData, TournamentData } from "@/src/types/prisma_include";
import { cn, formatMoney, formatTime } from "@/src/lib/utils";
import { Button } from "../../_components/ui/button";
import { useRouter } from "next/navigation";
import { api } from "@/src/trpc/react";
import type { Golfer } from "@prisma/client";
import { useState } from "react";
import LoadingSpinner from "../../_components/LoadingSpinner";

export default function PreTournamentPage({
  tournament,
  tourCard,
}: {
  tournament: TournamentData;
  tourCard: TourCardData | null | undefined;
}) {
  const existingTeam = api.team.getByUserTournament.useQuery({
    tourCardId: tourCard?.id ?? "",
    tournamentId: tournament.id,
  }).data;
  const golfers = api.golfer.getByTournament.useQuery({
    tournamentId: tournament.id,
  }).data;

  const teamGolfers = golfers
    ?.filter((obj) => existingTeam?.golferIds.includes(obj.apiId))
    .sort(
      (a, b) => (a.worldRank && b.worldRank && a.worldRank - b.worldRank) ?? 0,
    )
    .sort((a, b) => (a.group && b.group && a.group - b.group) ?? 0);
  return (
    <div>
      <TournamentCountdown tourney={tournament} key={tournament.id} />
      {!tourCard || !golfers || golfers.length === 0 ? (
        <></>
      ) : (
        <>
          <TeamPickForm {...{ tourCard, tournament, teamGolfers }} />
          <TeamTeeTimes {...{ golfers, teamGolfers }} />
        </>
      )}
    </div>
  );
}

function TeamPickForm({
  tourCard,
  tournament,
  teamGolfers,
}: {
  tourCard: TourCardData;
  tournament: TournamentData;
  teamGolfers: Golfer[] | undefined;
}) {
  const router = useRouter();
  const existingTeam = api.team.getByUserTournament.useQuery({
    tourCardId: tourCard?.id ?? "",
    tournamentId: tournament.id,
  }).data;
  const [isOpeningForm, setIsOpeningForm] = useState(false);

  return (
    <div className="mx-auto mb-4 w-fit max-w-4xl rounded-lg border border-slate-400 bg-slate-100 px-6 py-2 text-center shadow-xl">
      <div className="text-2xl font-bold">{tourCard.member?.fullname}</div>
      {tourCard.member.account > 0 && (
        <div className="mx-auto mb-8 w-5/6 text-center text-lg italic text-red-600">{`Please send ${formatMoney(tourCard.member.account)} to puregolfcollectivetour@gmail.com to unlock your picks.`}</div>
      )}
      <div className="text-xl font-bold">{`${tourCard?.position} - ${tourCard?.points} pts${tourCard?.earnings ? " - " + formatMoney(tourCard?.earnings ?? 0) : ""}`}</div>
      {teamGolfers
        ?.sort((a, b) => (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity))
        .sort((a, b) => (a.group ?? Infinity) - (b.group ?? Infinity))
        .map((golfer, i) => {
          return (
            <div
              key={golfer?.id}
              className={cn(
                i % 2 !== 0 && i < 9 && "border-b border-slate-500",
                i === 0 && "mt-2",
                "py-0.5",
              )}
            >
              <div className={cn("text-lg")}>
                {`#${golfer?.worldRank} ${golfer?.playerName} (${golfer?.rating})`}
              </div>
            </div>
          );
        })}
      <Button
        key={existingTeam?.id}
        onClick={() => {
          setIsOpeningForm(true);
          router.push(`/tournament/${tournament.id}/create-team`);
        }}
        disabled={tourCard.member.account > 0}
        variant={"action"}
        className="mb-4 mt-8 text-xl"
        size="lg"
      >
        {isOpeningForm ? (
          <LoadingSpinner />
        ) : existingTeam ? (
          "Change Your Team"
        ) : (
          "Create Your Team"
        )}
      </Button>
    </div>
  );
}

function TeamTeeTimes({
  golfers,
  teamGolfers,
}: {
  golfers: Golfer[] | undefined;
  teamGolfers: Golfer[] | undefined;
}) {
  if (
    !teamGolfers ||
    teamGolfers.length === 0 ||
    teamGolfers.filter((obj) => obj.roundOneTeeTime).length === 0
  )
    return <></>;
  const teeTimes = [
    ...new Set(
      teamGolfers
        ?.sort((a, b) => (b.endHole ?? 0) - (a.endHole ?? 0))
        ?.sort((a, b) => {
          if (!a.roundOneTeeTime && !b.roundOneTeeTime) return 0;
          if (!a.roundOneTeeTime) return 1;
          if (!b.roundOneTeeTime) return -1;
          return (
            new Date(a.roundOneTeeTime).getTime() -
            new Date(b.roundOneTeeTime).getTime()
          );
        })
        .map(
          (obj) => obj.roundOneTeeTime + " - " + (obj.endHole === 18 ? 1 : 10),
        ),
    ),
  ];
  const teamIds = teamGolfers?.map((a) => a.apiId);
  return (
    <>
      <div className="pt-4 text-center text-2xl font-bold">
        Thursday Tee Times
      </div>
      <div className="mx-auto flex max-w-[720px] flex-wrap justify-around">
        {teeTimes &&
          teeTimes.map((golfer, i) => {
            const time = new Date(golfer?.split(" - ")[0] ?? "");
            const wave = +(golfer?.split(" - ")[1] ?? "1");
            const group = golfers?.filter(
              (obj) =>
                obj.endHole === (wave === 1 ? 18 : 9) &&
                obj.roundOneTeeTime === golfer?.split(" - ")[0],
            );
            return (
              <div
                key={i}
                className="w-[180px] p-2 text-center text-lg font-bold"
              >
                {`${formatTime(time)} - Hole ${wave}`}
                <div className={cn("text-sm font-normal")}>
                  {group
                    ?.sort(
                      (a, b) =>
                        (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity),
                    )
                    .map((obj) => (
                      <div
                        key={obj.id}
                        className={cn(
                          teamIds?.includes(obj.apiId)
                            ? "font-semibold"
                            : "text-muted-foreground",
                        )}
                      >
                        {`#${obj.worldRank ?? "N/A"} ${obj.playerName}`}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
