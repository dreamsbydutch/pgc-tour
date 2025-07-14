import { formatMoney, formatRank } from "@pgc-utils";
import type { Tier } from "@prisma/client";

// --- Points and Payouts Popover ---
export function PointsAndPayoutsPopover({
  tier,
}: {
  tier: Tier | null | undefined;
}) {
  return (
    <div className="grid w-full grid-cols-3 text-center">
      <div className="mx-auto flex flex-col">
        <div className="text-base font-semibold text-white">Rank</div>
        {tier?.payouts.slice(0, 35).map((_, i) => (
          <div key={i} className="text-xs">
            {formatRank(i + 1)}
          </div>
        ))}
      </div>
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
