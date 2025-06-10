"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/app/_components/ui/table";
import { TournamentLogo } from "@/src/app/_components/OptimizedImage";
import type { ScheduleTableProps } from "../../types";
import { api } from "@/src/trpc/react";

/**
 * ScheduleTable Component
 *
 * Displays the tournament schedule for the current season.
 * Shows tournament details including dates, tier, course, and location.
 */
export function ScheduleTable({ className }: ScheduleTableProps) {
  const season = api.season.getCurrent.useQuery().data;
  const tournaments = api.tournament.getBySeason.useQuery(
    season?.id ? { seasonId: season.id } : { seasonId: "" },
    { enabled: !!season?.id }
  ).data;
  const tiers =  api.tier.getCurrent.useQuery().data;

  if (!tournaments?.length) {
    return (
      <div className="mt-4 text-center font-varela text-sm text-gray-500">
        No tournament data available
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 text-center font-varela font-bold">
        2025 PGC Schedule
      </div>
      <Table className={cn("mx-auto w-3/4 text-center font-varela", className)}>
        <TableHeader>
          <TableRow>
            <TableHead className="span text-center text-xs font-bold">
              Tournament
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Dates
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Tier
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Course
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Location
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tourney, i) => {
            const tier = tiers?.find((t) => t.id === tourney.tierId);
            const start = new Date(tourney.startDate);
            const end = new Date(tourney.endDate);

            return (
              <TableRow
                key={tourney.id}
                className={cn(
                  i === 16 ? "border-t-2 border-t-slate-500" : "",
                  i >= 16 ? "bg-yellow-50" : "",
                  tier?.name === "Major" ? "bg-blue-50" : "",
                )}
              >
                <TableCell className="flex items-center justify-center whitespace-nowrap text-center text-xs">
                  <TournamentLogo
                    src={tourney.logoUrl ?? ""}
                    className="pr-1"
                    alt={tourney.name}
                    size="small"
                  />
                  {tourney.name}
                </TableCell>
                <TableCell className="whitespace-nowrap border-l text-center text-xs">
                  {`${start.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })} - ${
                    start.getMonth() === end.getMonth()
                      ? end.toLocaleDateString("en-US", {
                          day: "numeric",
                        })
                      : end.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                  }`}
                </TableCell>
                <TableCell className="whitespace-nowrap border-l text-center text-xs">
                  {tier?.name}
                </TableCell>
                <TableCell className="whitespace-nowrap border-l text-center text-xs">
                  {tourney.course?.name}
                </TableCell>
                <TableCell className="whitespace-nowrap border-l text-center text-xs">
                  {tourney.course?.location}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
