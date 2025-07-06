/**
 * Header Components
 *
 * Simple, clean exports for the leaderboard header.
 * - LeaderboardHeaderContainer: Server component with data fetching (recommended)
 * - LeaderboardHeader: Client component with hook (for custom use)
 */

// Main component (for direct use with server data)
export { default as LeaderboardHeader } from "./LeaderboardHeader";

// Container component (recommended for general use - handles server data fetching)
export { default as LeaderboardHeaderContainer } from "./LeaderboardHeaderContainer";

// Default export is the container for ease of use
export { default } from "./LeaderboardHeaderContainer";

// Types
export type {
  TournamentWithIncludes,
  TournamentGroup,
} from "./LeaderboardHeader";
