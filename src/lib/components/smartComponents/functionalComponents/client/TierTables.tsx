import type { Tier } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { cn, formatMoney, formatNumber, formatRank } from "@/lib/utils/main";

// Use Pick/Omit for minimal Tier type

type MinimalTier = Pick<Tier, "id" | "name" | "payouts" | "points">;

export function PayoutsTable({ tiers }: { tiers: MinimalTier[] }) {
  const tierOrder = ["Standard", "Elevated", "Major", "Playoff"];
  const sortedTiers = [...tiers].sort(
    (a, b) => tierOrder.indexOf(a.name) - tierOrder.indexOf(b.name),
  );
  // Add Silver tier using Playoff payouts sliced at 75
  const playoffTier = sortedTiers.find((tier) => tier.name === "Playoff");
  const tiersWithSilver = [...sortedTiers];
  if (playoffTier && playoffTier?.payouts.length > 75) {
    const silverTier = {
      ...playoffTier,
      id: "silver-tier", // unique id for React keys
      name: "Silver",
      payouts: playoffTier.payouts.slice(75),
    };
    // Insert Silver after Playoff
    const playoffIndex = tiersWithSilver.findIndex((t) => t.name === "Playoff");
    tiersWithSilver.splice(playoffIndex + 1, 0, silverTier);
  }

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
            {tiersWithSilver.map((tier) => (
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
          {Array(30)
            .fill(1)
            .map((_obj, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm font-bold">
                  {formatRank(i + 1)}
                </TableCell>
                {tiersWithSilver.map((tier) => (
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

export function PointsTable({ tiers }: { tiers: MinimalTier[] }) {
  const tierOrder = ["Standard", "Elevated", "Major", "Playoff"];
  const sortedTiers = [...tiers].sort(
    (a, b) => tierOrder.indexOf(a.name) - tierOrder.indexOf(b.name),
  );
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
            {sortedTiers.map((tier) => (
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
          {Array(35)
            .fill(1)
            .map((_obj, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm font-bold">
                  {formatRank(i + 1)}
                </TableCell>
                {sortedTiers.map((tier) => (
                  <TableCell
                    className="border-l text-center text-xs"
                    key={`points-${tier.id}`}
                  >
                    {i >= 35 && tier.name === "Playoff"
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
