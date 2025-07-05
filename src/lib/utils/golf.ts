/**
 * @fileoverview Golf-specific utilities for tournaments, golfers, and teams
 * Provides specialized functions for golf data and tournament management
 */

import type {
  Golfer,
  Team,
  TourCard,
  Member,
  Tournament,
  Course,
} from "@prisma/client";
import { formatTime } from "./formatting";
import { isValidRound } from "./validation";

// ============= SHARED UTILITIES =============

/**
 * Safely converts a date-like value to a Date object and formats it as time
 * @param dateValue - Date, string, or null value
 * @returns Formatted time string or "N/A" if invalid
 */
function formatTeeTimeValue(
  dateValue: string | Date | null | undefined,
): string {
  return formatTime(dateValue);
}

/**
 * Gets tee time key for a specific round
 * @param round - Round number (1-4)
 * @returns Tee time property key
 */
function getRoundTeeTimeKey(round: number): string {
  if (!isValidRound(round)) {
    throw new Error(`Invalid round number: ${round}`);
  }
  return `round${ROUND_NAMES[round - 1]}TeeTime`;
}

// ============= CONSTANTS =============

/** Round name mapping for tee time keys */
const ROUND_NAMES = ["One", "Two", "Three", "Four"] as const;

/** Gets all round scores for a golfer as an array */
function getGolferRounds(golfer: Golfer): (number | null)[] {
  return [
    golfer.roundOne,
    golfer.roundTwo,
    golfer.roundThree,
    golfer.roundFour,
  ];
}

// ============= TEE TIME UTILITIES =============

/**
 * Gets the tee time for a golfer based on their current round
 * @param golfer - Golfer object with round and tee time data
 * @returns Formatted tee time string
 * @throws Error if golfer round is null
 * @example
 * getGolferTeeTime(golfer) // "10:30 AM"
 */
export function getGolferTeeTime(golfer: Golfer): string {
  if (golfer.round === null) {
    throw new Error("Golfer round is null");
  }

  const teeTimeKey = getRoundTeeTimeKey(golfer.round) as keyof Golfer;
  const teeTime = golfer[teeTimeKey];

  // Handle the mixed types that can come from golfer properties
  if (typeof teeTime === "string" || teeTime instanceof Date) {
    return formatTeeTimeValue(teeTime);
  }

  return "N/A";
}

/**
 * Gets the tee time for a team based on their current round
 * @param team - Team object with round and tee time data
 * @returns Formatted tee time string
 * @throws Error if team round is null
 * @example
 * getTeamTeeTime(team) // "10:30 AM"
 */
export function getTeamTeeTime(team: Team): string {
  if (team.round === null) {
    throw new Error("Team round is null");
  }

  const teeTimeKey = getRoundTeeTimeKey(team.round) as keyof Team;
  const teeTime = team[teeTimeKey] as string | null;

  return formatTeeTimeValue(teeTime);
}

// ============= ROUND & SCORING UTILITIES =============

/**
 * Gets a specific round score for a golfer
 * @param golfer - Golfer object
 * @param round - Round number (1-4)
 * @returns Round score or null if not available
 * @example
 * getGolferRoundScore(golfer, 2) // 72
 */
export function getGolferRoundScore(
  golfer: Golfer,
  round: number,
): number | null {
  switch (round) {
    case 1:
      return golfer.roundOne;
    case 2:
      return golfer.roundTwo;
    case 3:
      return golfer.roundThree;
    case 4:
      return golfer.roundFour;
    default:
      return null;
  }
}

/**
 * Gets a specific round tee time for a golfer
 * @param golfer - Golfer object
 * @param round - Round number (1-4)
 * @returns Tee time string or null if not available
 * @example
 * getGolferRoundTeeTime(golfer, 2) // "10:30 AM"
 */
export function getGolferRoundTeeTime(
  golfer: Golfer,
  round: number,
): string | null {
  if (!isValidRound(round)) {
    return null;
  }

  const teeTimeKey = getRoundTeeTimeKey(round) as keyof Golfer;
  const teeTime = golfer[teeTimeKey] as string | null;

  const formattedTime = formatTeeTimeValue(teeTime);
  return formattedTime === "N/A" ? null : formattedTime;
}

/**
 * Calculates the total strokes for a golfer across completed rounds
 * @param golfer - Golfer object
 * @returns Total strokes or null if no completed rounds
 * @example
 * calculateTotalStrokes(golfer) // 288
 */
export function calculateTotalStrokes(golfer: Golfer): number | null {
  const rounds = getGolferRounds(golfer);
  const completedRounds = rounds.filter(
    (round): round is number => round !== null,
  );

  if (completedRounds.length === 0) {
    return null;
  }

  return completedRounds.reduce((total, round) => total + round, 0);
}

/**
 * Gets the number of completed rounds for a golfer
 * @param golfer - Golfer object
 * @returns Number of completed rounds (0-4)
 * @example
 * getCompletedRounds(golfer) // 2
 */
export function getCompletedRounds(golfer: Golfer): number {
  const rounds = getGolferRounds(golfer);
  return rounds.filter((round) => round !== null).length;
}

// ============= POSITION & STATUS UTILITIES =============

/**
 * Parses a golf position string into a numeric value for sorting/comparison
 * @param position - Position string (e.g., "1", "T5", "CUT", "WD", "DQ")
 * @param specialPositionValues - Custom values for special positions
 * @returns Numeric position value
 * @example
 * parsePosition("1") // 1
 * parsePosition("T5") // 5
 * parsePosition("CUT") // 1000 (default)
 */
export function parsePosition(
  position: string | null,
  specialPositionValues: { cut?: number; wd?: number; dq?: number } = {},
): number {
  if (!position) return 999;

  const { cut = 1000, wd = 1001, dq = 1002 } = specialPositionValues;

  // Handle special positions
  if (position === "CUT") return cut;
  if (position === "WD") return wd;
  if (position === "DQ") return dq;

  // Handle tied positions (T5, T10, etc.)
  if (position.startsWith("T")) {
    const num = parseInt(position.substring(1));
    return isNaN(num) ? 999 : num;
  }

  // Handle regular numeric positions
  const num = parseInt(position);
  return isNaN(num) ? 999 : num;
}

/**
 * Checks if a golfer has made the cut
 * @param golfer - Golfer object
 * @returns True if golfer made the cut
 * @example
 * hasMadeCut(golfer) // true
 */
export function hasMadeCut(golfer: Golfer): boolean {
  return golfer.position !== "CUT";
}

/**
 * Checks if a golfer has withdrawn
 * @param golfer - Golfer object
 * @returns True if golfer has withdrawn
 * @example
 * hasWithdrawn(golfer) // false
 */
export function hasWithdrawn(golfer: Golfer): boolean {
  return golfer.position === "WD";
}

/**
 * Checks if a golfer has been disqualified
 * @param golfer - Golfer object
 * @returns True if golfer has been disqualified
 * @example
 * isDisqualified(golfer) // false
 */
export function isDisqualified(golfer: Golfer): boolean {
  return golfer.position === "DQ";
}

/**
 * Gets the golfer's current position as a number
 * @param golfer - Golfer object
 * @returns Position number or null for special positions
 * @example
 * getPositionNumber(golfer) // 15
 */
export function getPositionNumber(golfer: Golfer): number | null {
  if (!golfer.position) return null;

  // Use existing status check functions to handle special positions
  if (!hasMadeCut(golfer) || hasWithdrawn(golfer) || isDisqualified(golfer)) {
    return null;
  }

  // Use shared position parsing with default fallback
  const parsed = parsePosition(golfer.position);
  return parsed === 999 ? null : parsed;
}

/**
 * Checks if a golfer is in a tied position
 * @param golfer - Golfer object
 * @returns True if position starts with "T"
 * @example
 * isTiedPosition(golfer) // true for "T5"
 */
export function isTiedPosition(golfer: Golfer): boolean {
  return golfer.position?.startsWith("T") ?? false;
}

/**
 * Calculates scoring average for a golfer
 * @param golfer - Golfer object
 * @param roundsPlayed - Number of rounds to include (defaults to completed rounds)
 * @returns Scoring average or null
 * @example
 * getScoringAverage(golfer) // 72.5
 */
export function getScoringAverage(
  golfer: Golfer,
  roundsPlayed?: number,
): number | null {
  const totalStrokes = calculateTotalStrokes(golfer);
  const completed = roundsPlayed ?? getCompletedRounds(golfer);

  if (!totalStrokes || completed === 0) {
    return null;
  }

  return Math.round((totalStrokes / completed) * 100) / 100; // Round to 2 decimal places
}

// ============= TOURNAMENT STATUS UTILITIES =============

/**
 * Tournament status calculator
 * @param startDate - Tournament start date
 * @param endDate - Tournament end date
 * @param referenceDate - Reference date for comparison
 * @returns Tournament status
 * @example
 * getTournamentStatus(startDate, endDate, new Date()) // "current"
 */
export function getTournamentStatus(
  startDate: Date,
  endDate: Date,
  referenceDate: Date,
): "upcoming" | "current" | "completed" {
  const now = referenceDate.getTime();
  const start = startDate.getTime();
  const end = endDate.getTime();

  if (now < start) {
    return "upcoming";
  } else if (now >= start && now <= end) {
    return "current";
  } else {
    return "completed";
  }
}

/**
 * Calculates days until tournament start
 * @param startDate - Tournament start date
 * @param referenceDate - Reference date for comparison
 * @returns Days until start (negative if already started)
 * @example
 * getDaysUntilStart(tournamentStart, new Date()) // 5
 */
export function getDaysUntilStart(
  startDate: Date,
  referenceDate: Date,
): number {
  const timeDiff = startDate.getTime() - referenceDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Gets the current tournament round based on date
 * @param startDate - Tournament start date
 * @param referenceDate - Reference date for comparison
 * @returns Current round number (1-4) or 0 if not started
 * @example
 * getCurrentRound(tournamentStart, new Date()) // 2
 */
export function getCurrentRound(startDate: Date, referenceDate: Date): number {
  const daysSinceStart = Math.floor(
    (referenceDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceStart < 0) return 0; // Tournament hasn't started
  if (daysSinceStart >= 4) return 4; // Tournament finished or final round

  return daysSinceStart + 1;
}

// ============= DATA ENHANCEMENT UTILITIES =============

/**
 * Enhances tour card with member data fallback
 * Provides a default member object if member data is missing
 * @param tourCard - The tour card to enhance
 * @param member - Optional member data to attach
 * @returns Enhanced tour card with guaranteed member property
 * @example
 * enhanceTourCard(tourCard, member) // Tour card with member data
 * enhanceTourCard(tourCard) // Tour card with fallback member
 */
export function enhanceTourCard(
  tourCard: TourCard,
  member?: Member,
): TourCard & { member: Member } {
  return {
    ...tourCard,
    member: member || {
      id: tourCard.memberId || "",
      firstname: "Unknown",
      lastname: "Member",
      email: "",
      role: "MEMBER",
      account: 0,
      friends: [],
    },
  };
}

/**
 * Creates enhanced tournament with course fallback
 * Provides a default course object if course data is missing
 * @param tournament - The tournament to enhance
 * @param fallbackDate - Date to use for created/updated timestamps (optional, defaults to epoch)
 * @returns Enhanced tournament with guaranteed course property
 * @example
 * enhanceTournament(tournament) // Tournament with course data or fallback
 * enhanceTournament(tournament, new Date()) // Tournament with current timestamp
 */
export function enhanceTournament(
  tournament: Tournament & {
    teams: Team[];
    golfers: Golfer[];
    course?: Course;
  },
  fallbackDate?: Date,
): Tournament & {
  course: Course;
  teams: Team[];
  golfers: Golfer[];
} {
  const defaultDate = fallbackDate || new Date(0); // Use epoch as deterministic fallback

  return {
    ...tournament,
    course: tournament.course || {
      id: tournament.courseId || "",
      name: "Course TBD",
      createdAt: defaultDate,
      updatedAt: defaultDate,
      apiId: "",
      location: "",
      par: 72,
      front: 36,
      back: 36,
      timeZoneOffset: 0,
    },
    teams: tournament.teams,
    golfers: tournament.golfers,
  };
}
