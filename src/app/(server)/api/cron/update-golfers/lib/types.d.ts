/**
 * Types for the golfer update cron job
 */

import type { Course, Tournament, Golfer } from "@prisma/client";

// Core types
export type TournamentWithCourse = Tournament & { course: Course };

// Database golfer type with key fields for updates
export type DatabaseGolfer = Pick<
  Golfer,
  | "id"
  | "apiId"
  | "usage"
  | "roundOneTeeTime"
  | "roundTwoTeeTime"
  | "roundThreeTeeTime"
  | "roundFourTeeTime"
  | "position"
  | "score"
  | "thru"
  | "today"
  | "roundOne"
  | "roundTwo"
  | "roundThree"
  | "roundFour"
  | "makeCut"
  | "topTen"
  | "win"
  | "country"
  | "endHole"
  | "round"
>;

// Update data structure
export type GolferUpdateData = Partial<Omit<DatabaseGolfer, "id" | "apiId">>;

// Cron job result
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
