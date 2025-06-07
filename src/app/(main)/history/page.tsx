/**
 * Tournament History Page
 * 
 * This page serves as the main entry point for the history section, displaying
 * comprehensive historical tournament data for all members including:
 * 
 * Features:
 * - Tournament results and performance metrics
 * - Career earnings and points tracking
 * - Adjusted earnings based on current tier values
 * - Championship and major tournament achievements
 * - Individual golfer statistics with detailed breakdowns
 * - Member statistics with filtering and sorting capabilities
 * - Friends-only filtering for personalized views
 * - Toggle between regular and adjusted earnings/points
 * 
 * Architecture:
 * - Uses modular view components for clean separation of concerns
 * - Leverages custom hooks for data processing and state management
 * - Implements memoization for optimal performance
 * - Follows established patterns for consistent UI/UX
 * 
 * Data Flow:
 * 1. Main page loads and renders HistoryMainView
 * 2. HistoryMainView orchestrates the display of golfer and member stats
 * 3. Each view component manages its own state and data processing
 * 4. Custom hooks handle complex data transformations and API calls
 * 5. Reusable UI components provide consistent styling and behavior
 */
"use client";

import { HistoryMainView } from "./views";

// Force dynamic rendering to prevent static generation issues with real-time data
export const dynamic = "force-dynamic";

/**
 * History Page Component
 * 
 * Main page component that serves as the entry point for the history section.
 * Delegates rendering to the HistoryMainView component which orchestrates
 * the display of golfer statistics and member statistics views.
 * 
 * This component follows the established pattern of keeping page components
 * minimal and delegating to view components for actual functionality.
 * 
 * @returns The complete history page interface
 */
export default function HistoryPage() {
  return <HistoryMainView />;
}
