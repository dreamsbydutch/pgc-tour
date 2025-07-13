/**
 * CREATE GROUPS LIBRARY - BARREL EXPORTS
 * =======================================
 *
 * Consolidated exports for all create-groups functionality:
 * - Service functions for tournament group creation
 * - Handler for processing HTTP requests
 * - TypeScript types for type safety
 * - Constants and utilities
 */

// Main service functions
export { createTournamentGroups } from "./service";

// Request handler
export { handleCreateGroups, validateCronAuth } from "./handler";

// Types
export type {
  GroupCreationResult,
  EnhancedGolfer,
  GroupCreationContext,
  GroupCreationRequestBody,
} from "./types";

// Constants
export {
  GROUP_LIMITS,
  EXCLUDED_GOLFER_IDS,
  BATCH_SIZE,
  BATCH_DELAY,
} from "./types";
