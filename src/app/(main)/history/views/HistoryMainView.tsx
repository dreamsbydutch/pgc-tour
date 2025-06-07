/**
 * History Main View Component
 * 
 * Main container component that orchestrates the display of all history-related views.
 * This component serves as the primary layout for the history section, organizing
 * the presentation of both golfer statistics and member statistics in a cohesive interface.
 * 
 * Structure:
 * - GolferStatsTable: Individual golfer performance metrics and detailed breakdowns
 * - MemberStatsView: Comprehensive member statistics with filtering and sorting capabilities
 * 
 * Architecture:
 * - Follows the view-component pattern for clean separation of concerns
 * - Delegates specific functionality to specialized child components
 * - Maintains consistent layout and styling across the history section
 * 
 * Usage:
 * This component is typically rendered by the main history page component
 * and handles the high-level organization of historical data presentation.
 * 
 * @component
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
