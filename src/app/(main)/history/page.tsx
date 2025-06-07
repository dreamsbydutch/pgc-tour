/**
 * Tournament History Page
 *
 * This page displays historical tournament data for all members, including:
 * - Tournament results
 * - Earnings and points
 * - Adjusted earnings (based on current tier values)
 * - Championship/major achievements
 */
"use client";

import { HistoryMainView } from "./views";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

/**
 * History Page Component
 * Displays comprehensive historical data for all members and tournaments
 */
export default function HistoryPage() {
  return <HistoryMainView />;
}
