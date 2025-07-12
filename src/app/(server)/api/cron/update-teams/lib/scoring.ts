/**
 * Scoring calculation functions
 */

import type { Golfer } from "@prisma/client";
import type { RoundScores, RoundKey } from "./types";
import { PENALTY_STROKES, MIN_GOLFERS_FOR_CUT } from "./types";

/**
 * Determines the current round based on golfer data
 */
export function determineCurrentRound(
  golfers: Golfer[],
  tournamentRound: number,
): number {
  if (golfers.length === 0) return tournamentRound;

  const minGolferRound = Math.min(
    ...golfers.filter((g) => !isGolferCut(g)).map((g) => g.round ?? 1),
  );
  return Math.min(minGolferRound, tournamentRound);
}

/**
 * Calculates scores for each round based on tournament rules
 */
export function calculateRoundScores(
  golfers: Golfer[],
  currentRound: number,
  par: number,
): RoundScores {
  const scores: RoundScores = {
    roundOne: null,
    roundTwo: null,
    roundThree: null,
    roundFour: null,
  };

  // Rounds 1-2: Use all golfers
  if (currentRound > 1) {
    scores.roundOne = calculateRoundAverage(golfers, "roundOne", par);
  }
  if (currentRound > 2) {
    scores.roundTwo = calculateRoundAverage(golfers, "roundTwo", par);
  }

  // Rounds 3-4: Use top 5 active golfers only
  if (currentRound > 3) {
    const activeGolfers = golfers.filter((g) => !isGolferCut(g));
    if (activeGolfers.length >= MIN_GOLFERS_FOR_CUT) {
      scores.roundThree = calculateTop5Average(
        activeGolfers,
        "roundThree",
        par,
      );
    }
  }
  if (currentRound > 4) {
    const activeGolfers = golfers.filter((g) => !isGolferCut(g));
    if (activeGolfers.length >= MIN_GOLFERS_FOR_CUT) {
      scores.roundFour = calculateTop5Average(activeGolfers, "roundFour", par);
    }
  }

  return scores;
}

/**
 * Calculates average score for all golfers in a round
 */
function calculateRoundAverage(
  golfers: Golfer[],
  roundKey: RoundKey,
  par: number,
): number | null {
  const scores = golfers
    .map((g) => getGolferRoundScore(g, roundKey, par))
    .filter((score): score is number => score !== null);

  return scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : null;
}

/**
 * Calculates average of top 5 golfers in a round
 */
function calculateTop5Average(
  golfers: Golfer[],
  roundKey: RoundKey,
  par: number,
): number | null {
  const scoredGolfers = golfers
    .map((g) => ({ golfer: g, score: getGolferRoundScore(g, roundKey, par) }))
    .filter(
      (item): item is { golfer: Golfer; score: number } => item.score !== null,
    )
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return scoredGolfers.length > 0
    ? scoredGolfers.reduce((sum, item) => sum + item.score, 0) /
        scoredGolfers.length
    : null;
}

/**
 * Gets a golfer's score for a specific round with penalties
 */
function getGolferRoundScore(
  golfer: Golfer,
  roundKey: RoundKey,
  par: number,
): number | null {
  const score = golfer[roundKey];

  if (score !== null) return score;

  // Apply penalties for WD/DQ
  const position = golfer.position?.toUpperCase();
  if (position === "WD" || position === "DQ") {
    return par + PENALTY_STROKES;
  }

  return null;
}

/**
 * Calculates total score relative to par
 */
export function calculateTotalScore(
  roundScores: RoundScores,
  todaysScore: number | null,
  par: number,
): number | null {
  let total = 0;
  let hasScores = false;

  // Add completed round scores (relative to par)
  if (roundScores.roundOne !== null) {
    total += roundScores.roundOne - par;
    hasScores = true;
  }
  if (roundScores.roundTwo !== null) {
    total += roundScores.roundTwo - par;
    hasScores = true;
  }
  if (roundScores.roundThree !== null) {
    total += roundScores.roundThree - par;
    hasScores = true;
  }
  if (roundScores.roundFour !== null) {
    total += roundScores.roundFour - par;
    hasScores = true;
  }

  // Add today's score (already relative to par)
  if (todaysScore !== null) {
    total += todaysScore;
    hasScores = true;
  }

  return hasScores ? total : null;
}

/**
 * Calculates today's score based on current round rules
 */
export function calculateTodayScore(
  golfers: Golfer[],
  currentRound: number,
): number | null {
  const relevantGolfers =
    currentRound <= 2
      ? golfers
      : golfers
          .filter((g) => !isGolferCut(g))
          .sort((a, b) => (a.today ?? 999) - (b.today ?? 999))
          .slice(0, 5);

  const todayScores = relevantGolfers
    .map((g) => g.today)
    .filter((score): score is number => score !== null);

  return todayScores.length > 0
    ? todayScores.reduce((sum, score) => sum + score, 0) / todayScores.length
    : null;
}

/**
 * Calculates holes completed (thru) for team
 */
export function calculateThru(
  golfers: Golfer[],
  currentRound: number,
  isLivePlay: boolean,
): number | null {
  if (!isLivePlay) return 18;

  const relevantGolfers =
    currentRound <= 2
      ? golfers
      : golfers
          .filter((g) => !isGolferCut(g))
          .sort((a, b) => (a.today ?? 999) - (b.today ?? 999))
          .slice(0, 5);

  const playingGolfers = relevantGolfers.filter(
    (g) => g.round !== null && g.round >= currentRound && g.thru !== null,
  );

  if (playingGolfers.length === 0) return null;

  const totalThru = playingGolfers.reduce((sum, g) => sum + (g.thru ?? 0), 0);
  return Math.round((totalThru / playingGolfers.length) * 10) / 10;
}

/**
 * Checks if a golfer is cut, withdrawn, or disqualified
 */
export function isGolferCut(golfer: Golfer): boolean {
  const position = golfer.position?.toUpperCase();
  return position === "CUT" || position === "WD" || position === "DQ";
}
