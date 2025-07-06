/**
 * @fileoverview Golf domain business logic utilities
 * Essential golf-specific functions for tournaments, golfers, and scoring
 */

import type { Golfer, Team } from "@prisma/client";

// ===== GOLFER UTILITIES =====

/**
 * Gets the tee time for a golfer based on their current round
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
 * Gets a specific round score for a golfer
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
 * Calculates the total strokes for a golfer across completed rounds
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
 * Calculates scoring average for a golfer
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

  return Math.round((totalStrokes / completed) * 100) / 100;
}

/**
 * Gets the golfer's current position as a number
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

// ===== POSITION STATUS UTILITIES =====

/**
 * Checks if a golfer has made the cut
 */
export function hasMadeCut(golfer: Golfer): boolean {
  return golfer.position !== "CUT";
}

/**
 * Checks if a golfer has withdrawn
 */
export function hasWithdrawn(golfer: Golfer): boolean {
  return golfer.position === "WD";
}

/**
 * Checks if a golfer has been disqualified
 */
export function isDisqualified(golfer: Golfer): boolean {
  return golfer.position === "DQ";
}

/**
 * Checks if a golfer is in a tied position
 */
export function isTiedPosition(golfer: Golfer): boolean {
  return golfer.position?.startsWith("T") ?? false;
}

// ===== TEAM UTILITIES =====

/**
 * Gets the tee time for a team based on their current round
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

// ===== TOURNAMENT UTILITIES =====

/**
 * Tournament status calculator
 */
export function getTournamentStatus(
  startDate: Date,
  endDate: Date,
  referenceDate = new Date(),
): "upcoming" | "current" | "completed" {
  const now = new Date(referenceDate).getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

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

// ===== GOLF FORMATTING UTILITIES =====

/**
 * Formats a golf score with proper error handling
 */
export function formatScore(
  score: number | string | null | undefined | "E",
): string | number | null {
  if (score == null) return null;
  if (score === "E") return "E";

  const numScore = typeof score === "string" ? parseFloat(score) : score;

  if (isNaN(numScore) || !isFinite(numScore)) return null;

  // Handle unrealistic scores
  if (numScore > 99 || numScore < -40) {
    return null;
  }

  if (numScore > 0) {
    return "+" + numScore;
  } else if (numScore === 0) {
    return "E";
  } else {
    return numScore; // Negative scores show as-is
  }
}

/**
 * Formats the "thru" value for golf rounds
 */
export function formatThru(
  thru: number | string | null | undefined,
  teetime: string | null | undefined,
): string | number {
  if (thru == null) {
    return teetime ?? "N/A";
  }

  const numThru = typeof thru === "string" ? parseFloat(thru) : thru;

  if (isNaN(numThru) || !isFinite(numThru)) {
    return teetime ?? "N/A";
  }

  // Handle completed round
  if (numThru >= 18) {
    return "F";
  }

  // Handle not started
  if (numThru <= 0) {
    return teetime ?? "N/A";
  }

  return numThru;
}

// ===== HELPER FUNCTION =====

/**
 * Basic time formatting utility (extracted from formatting.ts)
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
