/**
 * Types for the team update cron job
 */

import type {
  Course,
  Tournament,
  Team,
  Golfer,
  Tier,
  Tour,
} from "@prisma/client";

// Core types
export type TournamentWithRelations = Tournament & {
  course: Course;
  tier: Tier;
  golfers: Golfer[];
  teams: Team[];
  tours: Tour[];
};

// Team calculation result
export interface TeamCalculation {
  round: number;
  roundOne?: number | null;
  roundTwo?: number | null;
  roundThree?: number | null;
  roundFour?: number | null;
  today?: number | null;
  thru?: number | null;
  score?: number | null;
  position?: string;
  pastPosition?: string;
  roundOneTeeTime?: string;
  roundTwoTeeTime?: string;
}

// Team update data for database
export interface TeamUpdateData {
  id: number;
  round?: number | null;
  roundOne?: number | null;
  roundTwo?: number | null;
  roundThree?: number | null;
  roundFour?: number | null;
  today?: number | null;
  thru?: number | null;
  score?: number | null;
  position?: string | null;
  pastPosition?: string | null;
  roundOneTeeTime?: string | null;
  roundTwoTeeTime?: string | null;
}

// Service result
export interface UpdateResult {
  teamsUpdated: number;
  tournamentProcessed: boolean;
  totalTeams: number;
}

// Cron job result
export interface CronJobResult {
  success: boolean;
  message: string;
  redirect?: string;
  stats?: {
    totalTeams: number;
    teamsUpdated: number;
    tournamentName: string;
    currentRound: number;
    livePlay: boolean;
  };
  error?: string;
  details?: string;
  status?: number;
}
