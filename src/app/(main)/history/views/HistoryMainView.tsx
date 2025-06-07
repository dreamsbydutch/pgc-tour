/**
 * History Main View Component
 * Main container for all history-related views
 */
"use client";

import { GolferStatsTable } from "../components/tables/golfer-stats-table";
import { MemberStatsView } from "./MemberStatsView";

export function HistoryMainView() {
  return (
    <>
      <GolferStatsTable />
      <MemberStatsView />
    </>
  );
}
