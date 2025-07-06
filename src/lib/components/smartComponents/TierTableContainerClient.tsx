"use client";

import { useTierTableData } from "@/lib/hooks/useTierTableData";
import { PayoutsTable, PointsTable } from "../functionalComponents/TierTables";
import { TierTableError } from "../functionalComponents/error/TierTableError";
import { TierTableSkeleton } from "../functionalComponents/loading/TierTableSkeleton";

type TableType = "payouts" | "points";

export function TierTableContainer({ type }: { type: TableType }) {
  const { tiers, isLoading, error } = useTierTableData();

  if (error || !tiers || !tiers.length) return <TierTableError error={error} />;
  if (isLoading) return <TierTableSkeleton />;
  if (type === "payouts") return <PayoutsTable tiers={tiers} />;
  return <PointsTable tiers={tiers} />;
}
