"use client";

import { cn, formatNumber, formatRank } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/app/_components/ui/table";
import { useMainStore } from "@/src/lib/store/store";
import type { PointsTableProps } from "../../types";
import { sortTiersByPayout } from "../../utils";

/**
 * PointsTable Component
 *
 * Displays the points distribution table for each tier.
 * Shows how many points are awarded for each finishing position across different tournament tiers.
 */
export function PointsTable({ className }: PointsTableProps) {
  const rawTiers = useMainStore((state) => state.currentTiers);
  const tiers = rawTiers ? sortTiersByPayout(rawTiers) : [];

  if (!tiers.length) {
    return (
      <div className="mt-4 text-center font-varela text-sm text-gray-500">
        No tier data available
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 text-center font-varela font-bold">
        Points Distributions
      </div>
      <Table className={cn("mx-auto w-3/4 text-center font-varela", className)}>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-bold">
              Finish
            </TableHead>
            {tiers.map((tier) => (
              <TableHead
                className="text-center text-xs font-bold"
                key={`points-${tier.id}`}
              >
                {tier.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers[0]?.points.slice(0, 35).map((_obj, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm font-bold">
                {formatRank(i + 1)}
              </TableCell>
              {tiers.map((tier) => (
                <TableCell
                  className="border-l text-center text-xs"
                  key={`points-${tier.id}`}
                >
                  {i >= 30 && tier.name === "Playoff"
                    ? "-"
                    : formatNumber(tier.points[i] ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
