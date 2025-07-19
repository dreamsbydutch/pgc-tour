/**
 * Export all hooks for StandingsView
 * This provides a clean API for importing hooks throughout the component
 */

// Data fetching hooks
export { useStandingsData } from "./useStandingsData";
export { useFriendManagement } from "./useFriendManagement";

// Type exports for hook returns
export type {
  UseStandingsDataReturn,
  UseFriendManagementReturn,
} from "../utils/types";
