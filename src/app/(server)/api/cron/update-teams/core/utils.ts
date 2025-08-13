import type { Team, TourCard } from "@prisma/client";
import { avgField } from "./aggregates";
import {
  computeTeamDailyContribution,
  computeWorstOfDay,
  type EventIndex,
  getTeamBracket,
  selectionCountFor,
  teamEligibleForRound,
} from "./playoffs";
import { pickTopNForRound } from "./selection";
import type { TournamentWithRelations } from "./types";

/**
 * Round a number to a fixed number of decimal places.
 *
 * Behavior
 * - If n is null or undefined, returns null (preserves missing values)
 * - Defaults to 2 decimal places
 * - Uses Math.round at the requested precision
 *
 * @param n      Number to round (nullable)
 * @param places Number of decimal places to keep (default: 2)
 * @returns The rounded number, or null when input is null/undefined
 */
export const roundDecimal = (n: number | null | undefined, places = 2) =>
  n == null ? null : Math.round(n * 10 ** places) / 10 ** places;

/**
 * Determine whether a position string represents a non-active (cut/withdrawn/DQ) status.
 *
 * Flags (case-insensitive)
 * - CUT: cut
 * - WD:  withdrawn
 * - DQ:  disqualified
 *
 * Notes
 * - Returns false for null/empty values
 * - Matches substrings, e.g., "T22 (CUT)" will be treated as cut
 *
 * @param pos Position string from the upstream feed
 * @returns true if the golfer should be considered inactive, otherwise false
 */
export const isCutStatus = (pos?: string | null) =>
  pos ? /CUT|WD|DQ/i.test(pos) : false;

/**
 * Detect whether the given tournament should be treated as a playoff.
 * Uses a simple, resilient heuristic: checks tier name for the word
 * "playoff" (case-insensitive). This mirrors the front-end logic.
 */
export function isPlayoffTournament(
  tournament: TournamentWithRelations,
): boolean {
  const tierName = (tournament.tier?.name ?? "").toLowerCase();
  return tierName.includes("playoff");
}

/**
 * Return the Nth earliest tee-time string from a list of tee-time strings.
 * - Prefers values that parse as dates; uses the earliest timestamps.
 * - Falls back to lexicographic ordering if parsing is inconsistent.
 * - Returns null if none are present or if N is out of range.
 *
 * @param times List of tee time strings (ISO or HH:MM). Null/undefined/blank ignored.
 * @param position 1-based rank to return (1 = earliest). Defaults to 1.
 */
export function earliestTimeStr(
  times: Array<string | null | undefined>,
  position = 1,
): string | null {
  const valid = times.filter((t): t is string => Boolean(t && t.trim().length));
  if (!valid.length) return null;

  // Normalize position (1-based). If invalid or out-of-range, return null.
  const pos = Math.max(1, Math.floor(position));

  // Prefer ISO/HH:MM parsing if possible; fallback to lexicographically smallest
  try {
    const parsed = valid
      .map((t) => ({ t, d: new Date(t).getTime() }))
      .filter(({ d }) => !Number.isNaN(d));
    if (parsed.length === valid.length && parsed.length > 0) {
      parsed.sort((a, b) => a.d - b.d);
      return parsed[pos - 1]?.t ?? null;
    }
  } catch {
    // ignore parsing issues; we fall back below
  }

  const sorted = [...valid].sort();
  return sorted[pos - 1] ?? null;
}

/**
 * Map a 1..4 round number to its corresponding Golfer round field key.
 */
export function roundKeyFor(
  n: 1 | 2 | 3 | 4,
): "roundOne" | "roundTwo" | "roundThree" | "roundFour" {
  return n === 1
    ? "roundOne"
    : n === 2
      ? "roundTwo"
      : n === 3
        ? "roundThree"
        : "roundFour";
}

/**
 * Compute daily contributions for a round (live or post). If the team is not eligible
 * (does not meet selection count), fall back to the bracket-wide worst-of-day for safety.
 */
export const roundContrib = (
  roundNum: 1 | 2 | 3 | 4,
  team: Team,
  tourCards: TourCard[],
  tournament: TournamentWithRelations,
  evIdx: EventIndex,
  par: number,
  wantLive: boolean,
) => {
  const contrib = computeTeamDailyContribution(
    team,
    tournament.golfers,
    roundNum,
    wantLive,
    evIdx,
    par,
  );
  if (contrib) return contrib;
  // Fallback: worst-of-day within the team's bracket.
  const worst = computeWorstOfDay(
    tournament,
    tourCards,
    roundNum,
    wantLive,
    evIdx,
  );
  const bracket = getTeamBracket(team, tourCards);
  const value = bracket === "gold" ? worst.gold.value : worst.silver.value;
  const thru = bracket === "gold" ? worst.gold.thru : worst.silver.thru;
  return { today: value, thru: thru, overPar: value };
};

/**
 * Compute the raw-round stroke average for a completed round using post semantics.
 * If the team is ineligible, convert the worst-of-day over-par to raw by adding par.
 */
export const rawRoundPost = (
  roundNum: 1 | 2 | 3 | 4,
  team: Team,
  tourCards: TourCard[],
  tournament: TournamentWithRelations,
  evIdx: EventIndex,
  par: number,
): number | null => {
  const info = teamEligibleForRound(team, tournament.golfers, evIdx, roundNum);
  const n = selectionCountFor(evIdx, roundNum);
  if (!info.eligible) {
    // worst-of-day overPar -> convert to raw by adding par
    const worst = computeWorstOfDay(
      tournament,
      tourCards,
      roundNum,
      false,
      evIdx,
    );
    const bracket = getTeamBracket(team, tourCards);
    const over = bracket === "gold" ? worst.gold.value : worst.silver.value;
    return (over ?? 0) + par;
  }
  const pool =
    n >= 10
      ? info.teamGolfers
      : pickTopNForRound(info.active, roundNum, false, par, n);
  const key = roundKeyFor(roundNum);
  return avgField(pool, key);
};

/**
 * Convenience helper to fetch raw round stroke averages for rounds 1..4 in one call.
 * Internally uses rawRoundPost for each round with post semantics and playoff selection rules.
 */
export const rawTeamTotals = (
  team: Team,
  tourCards: TourCard[],
  tournament: TournamentWithRelations,
  evIdx: EventIndex,
  par: number,
): {
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
} => {
  return {
    r1: rawRoundPost(1, team, tourCards, tournament, evIdx, par),
    r2: rawRoundPost(2, team, tourCards, tournament, evIdx, par),
    r3: rawRoundPost(3, team, tourCards, tournament, evIdx, par),
    r4: rawRoundPost(4, team, tourCards, tournament, evIdx, par),
  };
};
