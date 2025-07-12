/**
 * Table components for LeaderboardView
 */

import React from "react";
import {
  cn,
  formatScore,
  formatPercentage,
  getGolferTeeTime,
} from "@pgc-utils";
import { Table, TableRow } from "@pgc-ui";
import { getSortedTeamGolfers, getGolferRowClass, isPlayerCut } from "../utils";
import { CountryFlagDisplay, GolferStatsGrid } from "./UIComponents";
import type { LeaderboardGolfer, LeaderboardTeam } from "../types";

// ================= PGA DROPDOWN =================

export const PGADropdown: React.FC<{
  golfer: LeaderboardGolfer;
  userTeam?: { golferIds: number[] };
}> = ({ golfer, userTeam }) => {
  const isUserTeamGolfer = userTeam?.golferIds.includes(golfer.apiId);
  const isPlayerCutOrWithdrawn = isPlayerCut(golfer.position);

  return (
    <div
      className={cn(
        "col-span-10 mb-2 rounded-lg border-b border-l border-r border-slate-300 p-2 pt-1 shadow-lg",
        isUserTeamGolfer && "bg-slate-100",
        isPlayerCutOrWithdrawn && "text-gray-400",
      )}
    >
      <div className="mx-auto grid max-w-2xl grid-cols-12 sm:grid-cols-16">
        <CountryFlagDisplay
          country={golfer.country}
          position={golfer.position}
        />
        <GolferStatsGrid golfer={golfer} />
      </div>
    </div>
  );
};

// ================= GOLFER SCORE CELL =================

export const GolferScoreCell: React.FC<{
  golfer: LeaderboardGolfer;
}> = ({ golfer }) => {
  if (golfer.thru === 0) {
    return (
      <td className="text-xs" colSpan={2}>
        {getGolferTeeTime(golfer)}
      </td>
    );
  }

  return (
    <>
      <td className="text-xs">{formatScore(golfer.today)}</td>
      <td className="text-xs">{golfer.thru === 18 ? "F" : golfer.thru}</td>
    </>
  );
};

// ================= TEAM GOLFERS TABLE =================

export const TeamGolfersTable: React.FC<{
  team: LeaderboardTeam;
  teamGolfers: LeaderboardGolfer[] | undefined;
}> = ({ team, teamGolfers }) => {
  const sortedGolfers = getSortedTeamGolfers(
    team,
    teamGolfers,
  ) as LeaderboardGolfer[];

  return (
    <Table className="scrollbar-hidden mx-auto w-full max-w-3xl border border-gray-700 text-center font-varela">
      <TableRow className="bg-gray-700 font-bold text-gray-100 hover:bg-gray-700">
        <td className="px-0.5 text-xs">Pos</td>
        <td className="px-0.5 text-xs">Player</td>
        <td className="px-0.5 text-xs">Score</td>
        <td className="px-0.5 text-2xs">Today</td>
        <td className="px-0.5 text-2xs">Thru</td>
        <td className="hidden px-0.5 text-2xs md:table-cell">R1</td>
        <td className="hidden px-0.5 text-2xs md:table-cell">R2</td>
        <td className="hidden px-0.5 text-2xs md:table-cell">R3</td>
        <td className="hidden px-0.5 text-2xs md:table-cell">R4</td>
        <td className="hidden px-0.5 text-2xs xs:table-cell">Make Cut</td>
        <td className="hidden px-0.5 text-2xs xs:table-cell">Usage</td>
        <td className="px-0.5 text-2xs">Group</td>
      </TableRow>
      {sortedGolfers.map((golfer, i) => (
        <TableRow
          key={golfer.id}
          className={getGolferRowClass(team, golfer, i)}
        >
          <td className="px-1 text-xs">{golfer.position}</td>
          <td className="whitespace-nowrap px-1 text-sm">
            {golfer.playerName}
          </td>
          <td className="px-1 text-sm">{formatScore(golfer.score)}</td>
          <GolferScoreCell golfer={golfer} />
          <td className="hidden border-l border-gray-300 text-xs md:table-cell">
            {golfer.roundOne ?? "-"}
          </td>
          <td className="hidden border-gray-300 text-xs md:table-cell">
            {golfer.roundTwo ?? "-"}
          </td>
          <td className="hidden border-gray-300 text-xs md:table-cell">
            {golfer.roundThree ?? "-"}
          </td>
          <td className="hidden border-gray-300 text-xs md:table-cell">
            {golfer.roundFour ?? "-"}
          </td>
          <td className="hidden border-l border-gray-300 text-xs xs:table-cell">
            {golfer.makeCut === 0
              ? "-"
              : formatPercentage((golfer.makeCut ?? 0) * 100, false)}
          </td>
          <td className="hidden border-gray-300 text-xs xs:table-cell">
            {formatPercentage((golfer.usage ?? 0) * 100, false)}
          </td>
          <td className="border-gray-300 text-xs">{golfer.group}</td>
        </TableRow>
      ))}
    </Table>
  );
};
