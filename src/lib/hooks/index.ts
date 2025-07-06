/**
 * Main Hooks Index - Consolidated Hook Exports
 *
 * This is the new streamlined hooks index that exports only the
 * consolidated hooks from our refactored architecture.
 *
 * Phase 2 Step 2.1: Update main hooks index
 *
 * @fileoverview Main entry point for all application hooks
 */

// ============================================================================
// TOURNAMENT NAVIGATION HOOKS
// ============================================================================

/**
 * Tournament navigation and data access
 * Replaces 18+ individual tournament hooks with a single consolidated interface
 */
export { useTournament, useTournamentHistory } from "./useTournament";

/**
 * Current season tournament schedule
 * Provides current season's tournaments with tier and course information
 */
export { useCurrentSchedule } from "./useCurrentSchedule";

/**
 * Leaderboard header data and logic
 * Provides all data and utility functions needed for leaderboard header components
 */
export { useLeaderboardHeader } from "./useLeaderboardHeader";

/**
 * Current season tour standings
 * Provides current season's standings for all tours with tour cards sorted by points
 */
export { useCurrentStandings } from "./useCurrentStandings";

// ============================================================================
// LEADERBOARD DATA HOOKS
// ============================================================================

/**
 * Unified tournament leaderboard functionality
 * Replaces multiple team and leaderboard hooks with single consolidated interface
 */
export { useLeaderboard } from "./useLeaderboard";

// ============================================================================
// CHAMPIONS DATA HOOKS
// ============================================================================

/**
 * Recent tournament champions with timing validation
 * Provides recent winners with configurable time limits
 */
export { useRecentChampions } from "./useChampions";

/**
 * Latest champions with full team details
 * Provides most recent tournament champions with golfer information
 */
export { useLatestChampions } from "./useLatestChampions";

// ============================================================================
// TOUR CARD DATA HOOKS
// ============================================================================

/**
 * Tour card data access and filtering
 * Provides both simple array returns and enhanced result objects
 */
export {
  useTourCards,
  useMemberCards,
  useTourCardsEnhanced,
} from "./useTourCard";

// ============================================================================
// CHAMPION TROPHIES HOOK
// ============================================================================

/**
 * Champion trophies display for major wins
 * Handles filtering and display of championship victories
 */
export { useChampionTrophies } from "./useChampionTrophies";

// ============================================================================
// UTILITY HOOKS (PRESERVED)
// ============================================================================

/**
 * Core utility hooks that remain unchanged
 * These hooks provide essential app functionality outside of golf data
 */
export { useToast } from "./useToast";
export { useUser } from "./useUser";
export { usePWAInstall } from "./usePWAInstall";

/**
 * Course data from DataGolf API
 * Provides course data for course popover display
 */
export { useCourseData } from "./useCourseData";

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * Hook Export Summary:
 *
 * NEW CONSOLIDATED HOOKS (4 core hooks, 6 total functions):
 * - useTournament() - Tournament navigation (current, next, previous, etc.)
 * - useTournamentHistory() - Season-specific tournament history
 * - useLeaderboard() - Current/historical tournament leaderboards
 * - useRecentChampions() - Recent tournament winners
 * - useTourCards() - Tour card data with filtering
 * - useMemberCards() - Member-specific tour card data
 *
 * PRESERVED UTILITY HOOKS (3 hooks):
 * - useToast() - Toast notification management
 * - useUser() - User authentication and data
 * - usePWAInstall() - Progressive Web App installation
 *
 * TOTAL: 9 exported functions (vs 40+ previously)
 * CODE REDUCTION: ~89% (from 2,669 lines to ~316 lines)
 */
