/**
 * CREATE GROUPS TYPES
 * ===================
 *
 * Type definitions for the create-groups cron job functionality
 */

import type {
  DatagolfFieldGolfer,
  DatagolfFieldInput,
  DatagolfRankingInput,
} from "@pgc-types";

// Core types for group creation
export type GroupCreationResult = {
  success: boolean;
  groupsCreated: number;
  golfersProcessed: number;
  message: string;
  error?: string;
};

// Enhanced golfer type with ranking data
export type EnhancedGolfer = DatagolfFieldGolfer & {
  ranking_data?: DatagolfRankingInput["rankings"][0];
};

// Group creation request body
export interface GroupCreationRequestBody {
  forceCreate?: boolean;
  tournamentId?: string;
}

// Minimal tournament info required for playoff detection and copying
export type CurrentTournament = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  seasonId: string;
  tier?: { id: string; name: string } | null;
  tours?: { id: string }[];
};

// Group creation context
export interface GroupCreationContext {
  rankingsData: DatagolfRankingInput;
  fieldData: DatagolfFieldInput;
  currentTourney: CurrentTournament | null;
  existingGolfers: unknown[];
}

// Constants for group creation
export const GROUP_LIMITS = {
  GROUP_1: { percentage: 0.1, maxCount: 10 },
  GROUP_2: { percentage: 0.175, maxCount: 16 },
  GROUP_3: { percentage: 0.225, maxCount: 22 },
  GROUP_4: { percentage: 0.25, maxCount: 30 },
} as const;

export const EXCLUDED_GOLFER_IDS = [18417];
export const BATCH_SIZE = 5;
export const BATCH_DELAY = 100; // milliseconds
