"use client";

import { useRef } from "react";
import { cn, formatMoney } from "@/src/lib/utils";
import { AchievementIcons } from "./achievement-icons";
import type { ExtendedMember, ExtendedTournament } from "./types";
import type { Member, Tier } from "@prisma/client";
import { calculateMemberStats } from "./member-stats";
import { useMainStore } from "@/src/lib/store/store";
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableHeader,
} from "@/src/app/_components/ui/table";

// Define table columns for better organization
const columns = [
  { id: "member", header: "Member" },
  { id: "seasons", header: "Seasons" },
  { id: "earnings", header: "Earnings" },
  { id: "points", header: "Points" },
  { id: "appearances", header: "Apps" },
  { id: "wins", header: "Wins" },
  { id: "top5s", header: "Top 5" },
  { id: "top10s", header: "Top 10" },
  { id: "cutsMade", header: "Cuts Made" },
];

interface HistoryTableProps {
  sortedMemberData: ExtendedMember[];
  tournaments: ExtendedTournament[];
  showAdjusted: boolean;
  tiers?: Tier[];
  members?: Member[];
}

export function HistoryTable({
  sortedMemberData,
  tournaments,
  showAdjusted,
  tiers,
  members,
}: HistoryTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-2 w-full">
      <div ref={tableContainerRef} className="w-full overflow-auto">
        <Table className="min-w-full table-auto border-collapse">
          {/* Table Header */}
          <TableHeader className="sticky top-0 z-10 bg-white">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className="cursor-pointer border-b border-r border-gray-200 p-2 text-center text-xs font-bold hover:bg-gray-50"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {/* Table Body - Virtualized */}
          <TableBody>
            {sortedMemberData.map((member) => {
              return (
                <CustomTableRow
                  key={member.id + "-tr"}
                  member={member}
                  tournaments={tournaments}
                  tiers={tiers}
                  members={members}
                  showAdjusted={showAdjusted}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Table Row Component
interface TableRowProps {
  member: ExtendedMember;
  tournaments: ExtendedTournament[];
  tiers?: Tier[];
  members?: Member[];
  showAdjusted: boolean;
}

function CustomTableRow({
  member,
  tournaments,
  tiers,
  members,
  showAdjusted,
}: TableRowProps) {
  const stats = calculateMemberStats(member, showAdjusted, tournaments);
  const currentMember = useMainStore((state) => state.currentMember);

  // Determine if this is the current member or a friend
  const isCurrentMember = currentMember?.id === member.id;
  const isFriend = currentMember?.friends?.includes(member.id) ?? false;

  return (
    <TableRow
      className={cn(
        isCurrentMember ? "bg-slate-200 font-semibold" : "",
        isFriend ? "bg-slate-100" : "",
      )}
    >
      {/* Member Name and Achievements */}
      <TableCell className="border-b border-r border-gray-200 p-1 text-sm">
        <div className="flex flex-wrap items-center justify-center gap-1">
          <span
            className={cn("font-semibold", isCurrentMember ? "font-bold" : "")}
          >
            {member.fullname}
          </span>
          <AchievementIcons
            teams={(member.teams ?? []).filter((t) => t !== undefined)}
            tiers={tiers ?? []}
            tournaments={tournaments ?? []}
            tourCards={(member.tourCards ?? []).map((tc) => ({
              ...tc,
              member: members?.find((m) => m.id === tc.memberId),
            }))}
          />
        </div>
      </TableCell>

      {/* Seasons */}
      <TableCell className="table-cell border-b border-r border-gray-200 p-2 text-center align-middle text-xs">
        {stats.seasons}
      </TableCell>

      {/* Earnings */}
      <TableCell className="table-cell border-b border-r border-gray-200 p-2 text-center align-middle text-xs">
        <div className="whitespace-nowrap">{formatMoney(stats.earnings)}</div>
      </TableCell>

      {/* Points */}
      <TableCell className="table-cell border-b border-r border-gray-200 p-2 text-center align-middle text-xs">
        <div className="whitespace-nowrap">
          {stats.points.toLocaleString()} pts
        </div>
      </TableCell>

      {/* Appearances */}
      <TableCell className="table-cell border-b border-r border-gray-200 p-2 text-center align-middle text-xs">
        {stats.appearances}
      </TableCell>

      {/* Wins */}
      <TableCell className="table-cell border-b border-r border-gray-200 p-2 text-center align-middle text-xs">
        {stats.wins}
      </TableCell>

      {/* Top 5s */}
      <TableCell className="table-cell border-b border-r border-gray-200 p-2 text-center align-middle text-xs">
        {stats.top5s}
      </TableCell>

      {/* Top 10s */}
      <TableCell className="table-cell border-b border-r border-gray-200 p-2 text-center align-middle text-xs">
        {stats.top10s}
      </TableCell>

      {/* Cuts Made */}
      <TableCell className="table-cell border-b border-r border-gray-200 p-2 text-center align-middle text-xs">
        {stats.cutsMade} ({Math.round(stats.cutsPercent * 10) / 10}%)
      </TableCell>
    </TableRow>
  );
}
