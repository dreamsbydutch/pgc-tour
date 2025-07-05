/**
 * @fileoverview Golf-specific utilities for tournaments, golfers, and teams
 * Provides specialized functions for golf data and tournament management
 */

import type { Golfer, Team } from "@prisma/client";
import { formatTime } from "./formatting";

/**
 * Gets the tee time for a golfer based on their current round
 * @param golfer - Golfer object with round and tee time data
 * @returns Formatted tee time string
 * @throws Error if golfer round is null
 * @example
 * getGolferTeeTime(golfer) // "10:30 AM"
 */
export function getGolferTeeTime(golfer: Golfer): string {
  const roundNames = ["One", "Two", "Three", "Four", "Four"] as const;

  if (golfer.round === null) {
    throw new Error("Golfer round is null");
  }

  if (golfer.round < 1 || golfer.round > 4) {
    throw new Error(`Invalid round number: ${golfer.round}`);
  }

  const teeTimeKey =
    `round${roundNames[golfer.round - 1]}TeeTime` as keyof Golfer;
  const teeTime = golfer[teeTimeKey];

  if (!teeTime) {
    return "N/A";
  }

  return formatTime(new Date(teeTime));
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
  const roundNames = ["One", "Two", "Three", "Four", "Four"] as const;

  if (team.round === null) {
    throw new Error("Team round is null");
  }

  if (team.round < 1 || team.round > 4) {
    throw new Error(`Invalid round number: ${team.round}`);
  }

  const teeTimeKey = `round${roundNames[team.round - 1]}TeeTime` as keyof Team;
  const teeTime = team[teeTimeKey] as string | null;

  if (!teeTime) {
    return "N/A";
  }

  return formatTime(new Date(teeTime));
}

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
  const roundNames = ["One", "Two", "Three", "Four"] as const;

  if (round < 1 || round > 4) {
    return null;
  }

  const teeTimeKey = `round${roundNames[round - 1]}TeeTime` as keyof Golfer;
  const teeTime = golfer[teeTimeKey];

  return teeTime ? formatTime(new Date(teeTime)) : null;
}

/**
 * Calculates the total strokes for a golfer across completed rounds
 * @param golfer - Golfer object
 * @returns Total strokes or null if no completed rounds
 * @example
 * calculateTotalStrokes(golfer) // 288
 */
export function calculateTotalStrokes(golfer: Golfer): number | null {
  const rounds = [
    golfer.roundOne,
    golfer.roundTwo,
    golfer.roundThree,
    golfer.roundFour,
  ];
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
  const rounds = [
    golfer.roundOne,
    golfer.roundTwo,
    golfer.roundThree,
    golfer.roundFour,
  ];
  return rounds.filter((round) => round !== null).length;
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

  const position = golfer.position;

  // Handle special positions
  if (["CUT", "WD", "DQ"].includes(position)) {
    return null;
  }

  // Handle tied positions
  if (position.startsWith("T")) {
    const num = parseInt(position.substring(1));
    return isNaN(num) ? null : num;
  }

  // Handle regular positions
  const num = parseInt(position);
  return isNaN(num) ? null : num;
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

/**
 * Tournament status calculator
 * @param startDate - Tournament start date
 * @param endDate - Tournament end date
 * @param referenceDate - Reference date (defaults to now)
 * @returns Tournament status
 * @example
 * getTournamentStatus(startDate, endDate) // "current"
 */
export function getTournamentStatus(
  startDate: Date,
  endDate: Date,
  referenceDate = new Date(),
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
 * @param referenceDate - Reference date (defaults to now)
 * @returns Days until start (negative if already started)
 * @example
 * getDaysUntilStart(tournamentStart) // 5
 */
export function getDaysUntilStart(
  startDate: Date,
  referenceDate = new Date(),
): number {
  const timeDiff = startDate.getTime() - referenceDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Gets the current tournament round based on date
 * @param startDate - Tournament start date
 * @param referenceDate - Reference date (defaults to now)
 * @returns Current round number (1-4) or 0 if not started
 * @example
 * getCurrentRound(tournamentStart) // 2
 */
export function getCurrentRound(
  startDate: Date,
  referenceDate = new Date(),
): number {
  const daysSinceStart = Math.floor(
    (referenceDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceStart < 0) return 0; // Tournament hasn't started
  if (daysSinceStart >= 4) return 4; // Tournament finished or final round

  return daysSinceStart + 1;
}
