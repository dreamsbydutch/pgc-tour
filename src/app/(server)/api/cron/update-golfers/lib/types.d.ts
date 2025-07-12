/**
 * Types and interfaces for the golfer update cron job
 */

import type { Course, Tournament } from "@prisma/client";
import type {
  DataGolfLiveTournament,
  DatagolfFieldInput,
  DatagolfRankingInput,
} from "@/lib/types/datagolf_types";

// Core types
export type TournamentWithCourse = Tournament & { course: Course };

// API data structure
export interface ExternalAPIData {
  liveData: DataGolfLiveTournament;
  fieldData: DatagolfFieldInput;
  rankingsData: DatagolfRankingInput;
}

// Cron job result types
export interface CronJobResult {
  success: boolean;
  message: string;
  redirect?: string;
  stats?: {
    totalGolfers: number;
    liveGolfersCount: number;
    eventName: string;
    tournamentName: string;
  };
  error?: string;
  details?: string;
  status?: number;
}

// Service operation results
export interface UpdateResult {
  liveGolfersCount: number;
}
