"use client";

import TournamentCountdown from "./TournamentCountdown";
import type {
  TeamData,
  TourCardData,
  TournamentData,
} from "@/src/types/prisma_include";
import { cn, formatMoney, formatTime } from "@/src/lib/utils";
import { Button } from "../../_components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingSpinner from "../../_components/LoadingSpinner";

/**
 * PreTournamentPage Component
 *
 * Displays the pre-tournament page, including:
 * - A countdown timer until the tournament starts.
 * - A form to create or update the user's team.
 * - Tee times for the user's team.
 *
 * Props:
 * - tournament: The tournament data.
 * - tourCard: The user's tour card data (optional).
 */
export default function PreTournamentPage({
  tournament,
  tourCard,
  teams,
}: {
  tournament: TournamentData;
  tourCard: TourCardData | undefined;
  teams: TeamData[];
}) {
  const existingTeam = teams.find(
    (a) => a.tournamentId === tournament.id && a.tourCardId === tourCard?.id,
  );

  return (
    <div>
      <TournamentCountdown tourney={tournament} key={tournament.id} />
      {!tourCard ||
      !tournament.golfers ||
      tournament.golfers.length === 0 ||
      new Date(tournament.startDate).getTime() - new Date().getTime() >
        4 * 24 * 60 * 60 * 1000 ? (
        <></>
      ) : (
        <>
          <TeamPickForm {...{ tourCard, tournament, existingTeam }} />
          <TeamTeeTimes {...{ tourCard, tournament, existingTeam }} />
        </>
      )}
    </div>
  );
}

/**
 * TeamPickForm Component
 *
 * Displays a form for the user to create or update their team.
 * - Shows the user's current team golfers.
 * - Allows navigation to the team creation page.
 *
 * Props:
 * - tourCard: The user's tour card data.
 * - tournament: The tournament data.
 * - teamGolfers: The list of golfers in the user's team (optional).
 */
function TeamPickForm({
  tournament,
  tourCard,
  existingTeam,
}: {
  tournament: TournamentData;
  tourCard: TourCardData | undefined;
  existingTeam: TeamData | undefined;
}) {
  const router = useRouter();
  const [isOpeningForm, setIsOpeningForm] = useState(false);

  return (
    <div className="mx-auto mb-4 w-fit max-w-4xl rounded-lg border border-slate-400 bg-slate-100 px-6 py-2 text-center shadow-xl">
      <div className="text-2xl font-bold">{tourCard?.member?.fullname}</div>
      {(tourCard?.member?.account ?? 0) > 0 && (
        <div className="mx-auto mb-8 w-5/6 text-center text-lg italic text-red-600">{`Please send ${formatMoney(tourCard?.member?.account ?? 0)} to puregolfcollectivetour@gmail.com to unlock your picks.`}</div>
      )}
      <div className="text-xl font-bold">{`${tourCard?.position} - ${tourCard?.points} pts${tourCard?.earnings ? " - " + formatMoney(tourCard?.earnings ?? 0) : ""}`}</div>
      {tournament.golfers
        .filter((a) => existingTeam?.golferIds.includes(a.apiId))
        ?.sort((a, b) => (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity))
        .sort((a, b) => (a.group ?? Infinity) - (b.group ?? Infinity))
        .map((golfer, i) => (
          <div
            key={golfer?.id}
            className={cn(
              i % 2 !== 0 && i < 9 && "border-b border-slate-500",
              i === 0 && "mt-2",
              "py-0.5",
            )}
          >
            <div className="text-lg">
              {`#${golfer?.worldRank} ${golfer?.playerName} (${golfer?.rating})`}
            </div>
          </div>
        ))}
      <Button
        key={existingTeam?.id}
        onClick={() => {
          setIsOpeningForm(true);
          router.push(`/tournament/${tournament.id}/create-team`);
        }}
        disabled={(tourCard?.member?.account ?? 0) > 0}
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

/**
 * TeamTeeTimes Component
 *
 * Displays the tee times for the user's team.
 * - Groups golfers by their tee times and starting holes.
 * - Highlights golfers in the user's team.
 *
 * Props:
 * - golfers: The list of all golfers in the tournament (optional).
 * - teamGolfers: The list of golfers in the user's team (optional).
 * - course: The course data (optional).
 */
function TeamTeeTimes({
  tournament,
  existingTeam,
}: {
  tournament: TournamentData;
  existingTeam: TeamData | undefined;
}) {
  const teamGolfers = tournament.golfers.filter((a) =>
    existingTeam?.golferIds.includes(a.apiId),
  );
  if (
    !teamGolfers ||
    teamGolfers.length === 0 ||
    teamGolfers.filter((obj) => obj.roundOneTeeTime).length === 0 ||
    !tournament.course
  )
    return null;

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
        {teeTimes.map((golfer, i) => {
          const time = new Date(golfer?.split(" - ")[0] ?? "");
          const wave = +(golfer?.split(" - ")[1] ?? "1");
          const group = tournament.golfers?.filter(
            (obj) =>
              obj.endHole === (wave === 1 ? 18 : 9) &&
              obj.roundOneTeeTime === golfer?.split(" - ")[0],
          );
          return (
            <div
              key={i}
              className="w-[180px] p-2 text-center text-lg font-bold"
            >
              {`${formatTime(tournament.course, time)} - Hole ${wave}`}
              <div className="text-sm font-normal">
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
