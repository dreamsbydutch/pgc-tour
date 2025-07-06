"use client";

import { api } from "@/trpc/react";
import { PayoutsTable, PointsTable } from "../functionalComponents/TierTables";
import { TierTableSkeleton } from "../functionalComponents/loading/TierTableSkeleton";
import { TierTableError } from "../functionalComponents/error/TierTableError";

type TableType = "payouts" | "points";

export function TierTableContainer({ type }: { type: TableType }) {
  const { data: tiers = [], isLoading, error } = api.tier.getCurrent.useQuery();

  if (isLoading) return <TierTableSkeleton />;
  if (error || !tiers.length) return <TierTableError error={error} />;
  if (type === "payouts") return <PayoutsTable tiers={tiers} />;
  return <PointsTable tiers={tiers} />;
}
