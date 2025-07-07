import {
  PayoutsTable,
  PointsTable,
} from "../../functionalComponents/client/TierTables";
import { TierTableError } from "../../functionalComponents/error/TierTableError";
import { getTierTableData } from "@/server/actions/getTierTableData";

type TableType = "payouts" | "points";

export async function TierTableContainer({ type }: { type: TableType }) {
  const { tiers, error } = await getTierTableData();

  if (error || !tiers || !tiers.length) return <TierTableError error={error} />;
  if (type === "payouts") return <PayoutsTable tiers={tiers} />;
  return <PointsTable tiers={tiers} />;
}
