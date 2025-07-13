import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
} from "@pgc-ui";
import { cn, formatMoney, formatNumber, formatRank } from "@pgc-utils";

/**
 * PayoutsTable Component
 *
 * Displays a table of payout distributions for each tier.
 * Adds a "Silver" tier if the Playoff tier has more than 75 payouts.
 *
 * @param tiers - Array of tier objects with payouts and points
 */
export function PayoutsTable({
  tiers,
}: {
  /**
   * Array of tier objects to display
   */
  tiers: {
    id: string;
    name: string;
    payouts: number[];
    points: number[];
  }[];
}) {
  // Define the order of tiers for display
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

  if (tiersWithSilver.length === 0 || !tiersWithSilver)
    return <TierTableSkeleton />;
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

/**
 * PointsTable Component
 *
 * Displays a table of points distributions for each tier.
 *
 * @param tiers - Array of tier objects with payouts and points
 */
export function PointsTable({
  tiers,
}: {
  /**
   * Array of tier objects to display
   */
  tiers: {
    id: string;
    name: string;
    payouts: number[];
    points: number[];
  }[];
}) {
  // Define the order of tiers for display
  const tierOrder = ["Standard", "Elevated", "Major", "Playoff"];
  const sortedTiers = [...tiers].sort(
    (a, b) => tierOrder.indexOf(a.name) - tierOrder.indexOf(b.name),
  );

  if (sortedTiers.length === 0 || !sortedTiers) return <TierTableSkeleton />;
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

/**
 * TierTableSkeleton Component
 *
 * Displays a skeleton loading state mimicking the payouts/points table layout.
 */
function TierTableSkeleton() {
  // Mimic the table structure with skeletons
  const tierCount = 4;
  const rowCount = 35;
  const tierArray = Array.from({ length: tierCount });
  const rowArray = Array.from({ length: rowCount });

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-2 mt-4 w-1/3">
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="mx-auto w-3/4">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-1 text-center font-varela">
            <thead>
              <tr>
                <th>
                  <Skeleton className="mx-auto h-4 w-12" />
                </th>
                {tierArray.map((_, i) => (
                  <th key={i}>
                    <Skeleton className="mx-auto h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowArray.map((_, rowIdx) => (
                <tr key={rowIdx}>
                  <td>
                    <Skeleton className="mx-auto h-4 w-10" />
                  </td>
                  {tierArray.map((_, colIdx) => (
                    <td key={colIdx}>
                      <Skeleton className="mx-auto h-4 w-16" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
