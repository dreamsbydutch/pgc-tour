/**
 * Types for team update system
 */

import type { Course, Golfer, Team, Tournament } from "@prisma/client";

// Core types
export type TournamentWithCourse = Tournament & { course: Course };

// Golfer subset for optimized queries
export type GolferSubset = {
  id: number;
  apiId: number;
  playerName: string;
  position: string | null;
  score: number | null;
  today: number | null;
  thru: number | null;
  round: number | null;
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
  roundOneTeeTime: string | null;
  roundTwoTeeTime: string | null;
  roundThreeTeeTime: string | null;
  roundFourTeeTime: string | null;
  makeCut: number | null;
  topTen: number | null;
  win: number | null;
  earnings: number | null;
  endHole: number | null;
};

// Team with golfers
export type TeamWithGolfers = Team & { golfers: GolferSubset[] };

// Round and tee time keys for type safety
export type RoundKey = keyof Pick<
  Golfer,
  "roundOne" | "roundTwo" | "roundThree" | "roundFour"
>;
export type TeeTimeKey = keyof Pick<
  Golfer,
  | "roundOneTeeTime"
  | "roundTwoTeeTime"
  | "roundThreeTeeTime"
  | "roundFourTeeTime"
>;

// Result type for team updates
export type TeamUpdateResult = {
  success: boolean;
  error?: string;
  teamsUpdated: number;
  fieldsUpdated: number;
  databaseCalls: number;
  duration: number;
  tournamentName: string;
};

// Constants
export const PENALTY_STROKES = 8;
export const MIN_GOLFERS_FOR_CUT = 5;
