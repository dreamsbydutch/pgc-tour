"use client";

import { Table, TableRow } from "@/src/app/_components/ui/table";
import { cn, formatScore, getGolferTeeTime } from "@/src/lib/utils";
import type { Course, Golfer, Team } from "@prisma/client";

/**
 * TeamGolfersTable Component
 *
 * Displays a table of golfers for a specific team in a tournament.
 * - Includes golfer details such as position, score, rounds, and other stats.
 * - Supports responsive design with conditional column visibility based on screen size.
 *
 * Props:
 * - team: The team data containing golfer IDs and tournament details.
 */
export default function TeamGolfersTable({
  team,
  teamGolfers,
  course,
}: {
  team: Team;
  teamGolfers: Golfer[] | undefined;
  course?: Course | null | undefined;
}) {
  return (
    <Table className="scrollbar-hidden mx-auto w-full max-w-3xl border border-gray-700 text-center font-varela">
      {/* Table Header */}
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

      {/* Table Rows */}
      {teamGolfers
        ?.filter((g) => team.golferIds.includes(g.apiId))
        .sort(
          (a, b) =>
            (a.today ?? 999) - (b.today ?? 999) || // Sort by today's score
            (a.thru ?? 0) - (b.thru ?? 0) || // Then sort by holes completed
            (a.score ?? 999) - (b.score ?? 999) || // Then sort by total score
            (a.group ?? 999) - (b.group ?? 999), // Then sort by group
        )
        .map((golfer, i) => (
          <TableRow
            key={golfer.id}
            className={cn(
              (team.round ?? 0) >= 3 && i === 4
                ? "border-b border-gray-700"
                : "",
              i === 9 && "border-b border-gray-700",
              (golfer.position === "CUT" ||
                golfer.position === "WD" ||
                golfer.position === "DQ") &&
                "text-gray-400",
            )}
          >
            {/* Golfer Position */}
            <td className="px-1 text-xs">{golfer.position}</td>

            {/* Golfer Name */}
            <td className="whitespace-nowrap px-1 text-sm">
              {golfer.playerName}
            </td>

            {/* Golfer Score */}
            <td className="px-1 text-sm">{formatScore(golfer.score)}</td>

            {/* Golfer Today and Thru */}
            {golfer.thru === 0 && course ? (
              <td className="text-xs" colSpan={2}>
                {course && getGolferTeeTime(golfer)}
              </td>
            ) : (
              <>
                <td className="text-xs">{formatScore(golfer.today)}</td>
                <td className="text-xs">
                  {golfer.thru === 18 ? "F" : golfer.thru}
                </td>
              </>
            )}

            {/* Golfer Rounds */}
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

            {/* Golfer Make Cut */}
            <td className="hidden border-l border-gray-300 text-xs xs:table-cell">
              {golfer.makeCut === 0
                ? "-"
                : Math.round(+(golfer.makeCut ?? 0) * 1000) / 10 + "%"}
            </td>

            {/* Golfer Usage */}
            <td className="hidden border-gray-300 text-xs xs:table-cell">
              {Math.round(+(golfer.usage ?? 0) * 1000) / 10 + "%"}
            </td>

            {/* Golfer Group */}
            <td className="border-gray-300 text-xs">{golfer.group}</td>
          </TableRow>
        ))}
    </Table>
  );
}
