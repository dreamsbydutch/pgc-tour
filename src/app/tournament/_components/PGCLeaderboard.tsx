"use client";

import {
  cn,
  formatScore,
  getGolferTeeTime,
  getTeamTeeTime,
} from "@/src/lib/utils";
import type {
  TeamData,
  TourCardData,
  TournamentData,
} from "@/src/types/prisma_include";
import type { Golfer } from "@prisma/client";
import { useState } from "react";
import { Table, TableRow } from "../../_components/ui/table";
import { api } from "@/src/trpc/react";
import { MoveDownIcon, MoveHorizontalIcon, MoveUpIcon } from "lucide-react";

export function PGCListing({
  tournament,
  team,
  golfers,
  tourCard,
}: {
  tournament: TournamentData;
  team: TeamData;
  golfers: Golfer[] | undefined;
  tourCard: TourCardData | null | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const member = api.member.getSelf.useQuery();
  const course = api.course.getById.useQuery({ courseID: tournament.courseId });
  const posChange =
    (team?.pastPosition ? +team.pastPosition.replace("T", "") : 0) -
    (team?.position ? +team.position.replace("T", "") : 0);
  const moneyThreshold =
    tournament.tier.name === "Major"
      ? "Ten"
      : tournament.tier.name === "Elevated"
        ? "Five"
        : "Three";
  return (
    <div
      key={team.id}
      onClick={() => setIsOpen(!isOpen)}
      className="my-1 grid grid-flow-row grid-cols-10 text-center"
    >
      <div
        className={cn(
          "col-span-10 grid grid-flow-row grid-cols-10 py-0.5",
          team.tourCardId === tourCard?.id && "bg-slate-200 font-semibold",
          tourCard?.member.friends.includes(team.tourCard.memberId) &&
            "bg-slate-100",
          member.data?.friends.includes(team.tourCard.memberId) &&
            "bg-slate-100",
        )}
      >
        <div className="col-span-2 flex place-self-center font-varela text-base">
          {team.position}
          {/* {posChange === 0 ? (
            // <span className="ml-0.5 flex items-center justify-center text-2xs">
            //   <MoveHorizontalIcon className="w-2" />
            // </span>
            <></>
          ) : posChange > 0 ? (
            <span className="ml-0.5 flex items-center justify-center text-xs text-green-900">
              <MoveUpIcon className="w-3" />
              {Math.abs(posChange)}
            </span>
          ) : (
            <span className="ml-0.5 flex items-center justify-center text-2xs text-red-900">
              <MoveDownIcon className="w-3" />
              {Math.abs(posChange)}
            </span>
          )} */}
        </div>
        <div className="col-span-4 place-self-center font-varela text-lg">
          {team.tourCard.displayName}
        </div>
        <div className="col-span-2 place-self-center font-varela text-base">
          {formatScore(team.score)}
        </div>
        {team.thru === 0 ? (
          <div className="col-span-2 place-self-center font-varela text-sm">
            {course.data && getTeamTeeTime(course.data, team)}
          </div>
        ) : (
          <>
            <div className="col-span-1 place-self-center font-varela text-sm">
              {formatScore(team.today)}
            </div>
            <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm">
              {team.thru === 18 ? "F" : team.thru}
            </div>
          </>
        )}
      </div>
      {isOpen && (
        <div
          className={cn(
            "col-span-10",
            team.tourCardId === tourCard?.id &&
              "bg-gradient-to-b from-slate-200 via-slate-100 to-slate-100",
            tourCard?.member.friends.includes(team.tourCard.memberId) &&
              "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
            member.data?.friends.includes(team.tourCard.memberId) &&
              "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
            isOpen && "border-b border-slate-300 p-2",
          )}
        >
          <div
            className={cn(
              "col-span-10 grid grid-cols-12 items-center justify-center",
            )}
          >
            <div className="col-span-7 text-sm font-bold">Rounds</div>
            {(tournament.currentRound ?? 0) <= 2 ? (
              <>
                <div className="col-span-3 text-sm font-bold">Make Cut</div>
                <div className="col-span-2 text-sm font-bold">
                  Top {moneyThreshold}
                </div>
              </>
            ) : (
              <>
                <div className="col-span-3 text-sm font-bold">
                  Top {moneyThreshold}
                </div>
                <div className="col-span-2 text-sm font-bold">Win</div>
              </>
            )}
            <div className="col-span-7 text-lg">
              {team.roundOne ?? "-"}
              {team.roundTwo ? " / " + team.roundTwo : ""}
              {team.roundThree ? " / " + team.roundThree : ""}
              {team.roundFour ? " / " + team.roundFour : ""}
            </div>
            {(tournament.currentRound ?? 0) <= 2 ? (
              <>
                <div className="col-span-3 text-lg">
                  {Math.round((team.makeCut ?? 0) * 1000) / 10}%
                </div>
                <div className="col-span-2 text-lg">
                  {Math.round(
                    (Number(team[("top" + moneyThreshold) as keyof TeamData]) ??
                      0) * 1000,
                  ) / 10}
                  %
                </div>
              </>
            ) : (
              <>
                <div className="col-span-3 text-lg">
                  {Math.round(
                    (Number(team[("top" + moneyThreshold) as keyof TeamData]) ??
                      0) * 1000,
                  ) / 10}
                  %
                </div>
                <div className="col-span-2 text-lg">
                  {Math.round((team.win ?? 0) * 1000) / 10}%
                </div>
              </>
            )}
          </div>
          <div className="col-span-10 mx-auto my-4 w-11/12">
            <Table className="scrollbar-hidden mx-auto w-full border border-gray-700 text-center font-varela">
              <TableRow className="bg-gray-700 font-bold text-gray-100 hover:bg-gray-700">
                <td className="text-sm">Pos</td>
                <td className="text-sm">Player</td>
                <td className="text-sm">Score</td>
                <td className="text-xs">Today</td>
                <td className="text-xs">Thru</td>
                <td className="text-xs">Group</td>
              </TableRow>
              {golfers
                ?.filter((g) => team.golferIds.includes(g.apiId))
                .sort(
                  (a, b) =>
                    (a.today ?? 0) - (b.today ?? 0) || // Sort by today
                    (a.thru ?? 0) - (b.thru ?? 0) || // Then sort by thru
                    (a.score ?? 0) - (b.score ?? 0) || // Then sort by score
                    (a.group ?? 0) - (b.group ?? 0),
                )
                .map((golfer, i) => (
                  <TableRow
                    key={golfer.id}
                    className={cn(
                      (team.round ?? 0) >= 3 && i === 4
                        ? "border-b border-gray-700"
                        : "",
                      i === 9 && "border-b border-gray-700",
                    )}
                  >
                    <td className="text-sm">{golfer.position}</td>
                    <td className="whitespace-nowrap px-1.5 text-sm">
                      {golfer.playerName}
                    </td>
                    <td className="text-sm">{formatScore(golfer.score)}</td>
                    {golfer.thru === 0 ? (
                      <td className="text-xs" colSpan={2}>
                        {course.data && getGolferTeeTime(course.data, golfer)}
                      </td>
                    ) : (
                      <>
                        <td className="text-xs">{formatScore(golfer.today)}</td>
                        <td className="text-xs">
                          {golfer.thru === 18 ? "F" : golfer.thru}
                        </td>
                      </>
                    )}
                    <td className="text-xs">{golfer.group}</td>
                  </TableRow>
                ))}
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
