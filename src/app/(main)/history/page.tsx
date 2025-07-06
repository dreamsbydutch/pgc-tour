"use client";

import { GolferStatsTable } from "../../../lib/components/GolferStatsTable";
import { HistoryTable } from "../../../lib/components/HistoryTable";

// Import our refactored component

/**
 * Simplified History Page
 *
 * Combines member statistics and golfer statistics in a single page.
 * Much simpler than the original implementation with views, hooks, utils, etc.
 */
export default function HistoryPage() {
  return (
    <div className="container mx-auto space-y-12 py-8">
      {/* Member Statistics */}
      <HistoryTable />

      {/* Golfer Statistics */}
      <GolferStatsTable />
    </div>
  );
}
