"use client";

import { cn, formatMoney, formatRank } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/app/_components/ui/table";
import { useMainStore } from "@/src/lib/store/store";
import type { PayoutsTableProps } from "../../types";
import {
  sortTiersByPayout,
  createSilverTier,
  getTierDisplayName,
  getTierStyling,
} from "../../utils";

/**
 * PayoutsTable Component
 *
 * Displays the payouts distribution table for each tier.
 * Includes special handling for Silver tier and playoff styling.
 */
export function PayoutsTable({ className }: PayoutsTableProps) {
  const rawTiers = useMainStore((state) => state.currentTiers);
  let tiers = rawTiers ? sortTiersByPayout(rawTiers) : [];

  // Add Silver tier for display if playoff tier exists
  const playoffTier = tiers.find((t) => t.name === "Playoff");
  if (playoffTier) {
    tiers = [...tiers, createSilverTier(playoffTier)];
  }
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
        Payouts Distributions
      </div>
      <Table className={cn("mx-auto w-3/4 text-center font-varela", className)}>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-bold">
              Finish
            </TableHead>
            {tiers.map((tier) => (
              <TableHead
                className={cn(
                  "text-center text-xs font-bold",
                  getTierStyling(tier.name),
                )}
                key={`payouts-${tier.id}`}
              >
                {getTierDisplayName(tier.name)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers[0]?.payouts.slice(0, 30).map((_obj, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm font-bold">
                {formatRank(i + 1)}
              </TableCell>
              {tiers.map((tier) => (
                <TableCell
                  className={cn(
                    "border-l text-center text-xs",
                    getTierStyling(tier.name),
                  )}
                  key={`payouts-${tier.id}`}
                >
                  {formatMoney(tier.payouts[i] ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
