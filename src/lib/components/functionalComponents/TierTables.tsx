import type { Tier } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../functionalComponents/ui/table";
import { cn } from "@/lib/utils/core";
import {
  formatMoney,
  formatNumber,
  formatRank,
} from "@/lib/utils/domain/formatting";

export function PayoutsTable({ tiers }: { tiers: Tier[] }) {
  return (
    <>
      <div className="mt-4 text-center font-varela font-bold">
        Payouts Distributions
      </div>
      <Table className="mx-auto w-3/4 text-center font-varela">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-bold">
              Finish
            </TableHead>
            {tiers.map((tier) => (
              <TableHead
                className={cn(
                  "text-center text-xs font-bold",
                  tier.name === "Playoff" &&
                    "border-l border-l-slate-500 bg-yellow-50 bg-opacity-50",
                  tier.name === "Silver" && "bg-gray-100 bg-opacity-50",
                )}
                key={`payouts-${tier.id}`}
              >
                {tier.name === "Playoff" ? "Gold" : tier.name}
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
                    tier.name === "Playoff" &&
                      "border-l-slate-500 bg-yellow-50 bg-opacity-50",
                    tier.name === "Silver" && "bg-gray-100 bg-opacity-50",
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

export function PointsTable({ tiers }: { tiers: Tier[] }) {
  return (
    <>
      <div className="mt-4 text-center font-varela font-bold">
        Points Distributions
      </div>
      <Table className="mx-auto w-3/4 text-center font-varela">
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
