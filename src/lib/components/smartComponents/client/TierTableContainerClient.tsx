"use client";

import { useTiers } from "@/lib/store/seasonalStoreHooks";
import {
  PayoutsTable,
  PointsTable,
} from "../functionalComponents/client/TierTables";
import { TierTableSkeleton } from "../functionalComponents/loading/TierTableSkeleton";

type TableType = "payouts" | "points";

export function TierTableContainer({ type }: { type: TableType }) {
  const tiers = useTiers();
  if (!tiers) return <TierTableSkeleton />;
  if (type === "payouts") return <PayoutsTable tiers={tiers} />;
  return <PointsTable tiers={tiers} />;
}
