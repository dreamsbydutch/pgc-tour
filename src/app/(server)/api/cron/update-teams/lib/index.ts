/**
 * TEAM UPDATE LIBRARY - BARREL EXPORTS
 * ====================================
 *
 * Consolidated exports for all team update functionality:
 * - Service functions for team scoring and updates
 * - Handler for processing HTTP requests
 * - TypeScript types for type safety
 * - Constants and utilities
 */

// Main service functions
export { updateAllTeamsOptimized, updateAllTeamsLegacy } from "./service";

// Request handler
export { handleTeamUpdate } from "./handler";

// Types
export type {
  TeamUpdateResult,
  TournamentWithCourse,
  TeamWithGolfers,
  GolferSubset,
  RoundKey,
  TeeTimeKey,
} from "./types";

// Constants
export { PENALTY_STROKES, MIN_GOLFERS_FOR_CUT } from "./types";
