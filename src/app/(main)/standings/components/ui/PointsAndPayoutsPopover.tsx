"use client";

import { formatMoney, formatRank } from "@/src/lib/utils";
import type { PointsAndPayoutsPopoverProps } from "../../types";

/**
 * PointsAndPayoutsPopover Component
 *
 * Displays a table showing rank positions and their corresponding payouts.
 *
 * Props:
 * - tier: The tier data containing payouts information.
 */
export function PointsAndPayoutsPopover({
  tier,
}: PointsAndPayoutsPopoverProps) {
  return (
    <div className="grid w-full grid-cols-3 text-center">
      {/* Rank Column */}
      <div className="mx-auto flex flex-col">
        <div className="text-base font-semibold text-white">Rank</div>
        {tier?.payouts.slice(0, 35).map((_, i) => (
          <div key={i} className="text-xs">
            {formatRank(i + 1)}
          </div>
        ))}
      </div>

      {/* Payouts Column */}
      <div className="col-span-2 mx-auto flex flex-col">
        <div className="text-base font-semibold">Payouts</div>
        {tier?.payouts.slice(0, 35).map((payout) => (
          <div key={"payout-" + payout} className="text-xs">
            {formatMoney(payout)}
          </div>
        ))}
      </div>
    </div>
  );
}
