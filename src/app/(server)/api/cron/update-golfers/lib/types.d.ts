/**
 * Simple types for the golfer update cron job
 */

import type { Course, Tournament } from "@prisma/client";

// Core types
export type TournamentWithCourse = Tournament & { course: Course };

// Cron job result
export interface CronJobResult {
  success: boolean;
  message: string;
  error?: string;
  status?: number;
}

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
