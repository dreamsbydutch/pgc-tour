/**
 * Types for team scoring update system
 */

import type { Course, Golfer, Team, Tournament } from "@prisma/client";

// Core types
export type TournamentWithCourse = Tournament & { course: Course };
export type TeamWithGolfers = Team & { golfers: Golfer[] };
export type RoundScores = Pick<
  Team,
  "roundOne" | "roundTwo" | "roundThree" | "roundFour"
>;

// Round keys for type safety
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

// Constants
export const PENALTY_STROKES = 8;
export const MIN_GOLFERS_FOR_CUT = 5;
