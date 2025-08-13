import type { Team, Golfer } from "@prisma/client";
import { isCutStatus } from "./utils";

/**
 * Return the list of Golfer rows that belong to the provided team.
 *
 * Notes
 * - Team.golferIds contains external API identifiers; we match them to Golfer.apiId.
 * - Order is preserved from the input list (no sorting is applied here).
 *
 * @param team Team whose roster should be resolved
 * @param all  All golfers present in the current tournament snapshot
 * @returns The golfers belonging to the team
 */
export function getTeamGolfers(team: Team, all: Golfer[]) {
  return all.filter((g) => team.golferIds.includes(g.apiId));
}

/**
 * Filter out golfers who are no longer active (CUT/MDF/etc.).
 *
 * Implementation detail
 * - Delegates the status interpretation to isCutStatus, which treats null/unknown defensively.
 *
 * @param golfers The golfers to filter
 * @returns Only golfers that are still active for scoring purposes
 */
export function getActive(golfers: Golfer[]) {
  return golfers.filter((g) => !isCutStatus(g.position ?? null));
}

/**
 * Compute a per-round, relative-to-par value for ranking a single golfer.
 *
 * Semantics
 * - When live = true, use Golfer.today (already an over/under par delta for the day).
 * - When live = false, use the raw round strokes (roundOne..roundFour) minus course par
 *   to produce an over/under par value for that round.
 *
 * @param golfer Golfer row to evaluate
 * @param round  1..4 round selector
 * @param live   Whether to use live semantics (today) or post semantics (raw round)
 * @param par    Course par used to translate raw strokes into over/under par
 * @returns A numeric value where lower is better (more under par)
 */
// Compute the round-relative value in a type-safe way (no any/indexed access)
function getRoundRelativeScore(
  golfer: Golfer,
  round: 1 | 2 | 3 | 4,
  live: boolean,
  par: number,
): number {
  if (live) return golfer.today ?? 0;
  switch (round) {
    case 1:
      return (golfer.roundOne ?? 0) - par;
    case 2:
      return (golfer.roundTwo ?? 0) - par;
    case 3:
      return (golfer.roundThree ?? 0) - par;
    case 4:
      return (golfer.roundFour ?? 0) - par;
  }
}

/**
 * Rank a set of golfers for the given round and scoring mode.
 *
 * Ordering
 * 1) Primary key: round-relative over/under par (lower is better)
 * 2) Tie-breaker A: cumulative tournament score (lower is better)
 * 3) Tie-breaker B: apiId (ascending) to ensure deterministic order
 *
 * @param golfers Golfers to rank
 * @param round   Round number 1..4
 * @param live    Live (today-based) vs post (raw round-based) semantics
 * @param par     Course par used when live = false
 * @returns New array sorted by ascending performance (best first)
 */
export function rankForRound(
  golfers: Golfer[],
  round: 1 | 2 | 3 | 4,
  live: boolean,
  par: number,
): Golfer[] {
  return [...golfers].sort((a, b) => {
    const va = getRoundRelativeScore(a, round, live, par);
    const vb = getRoundRelativeScore(b, round, live, par);
    if (va !== vb) return va - vb; // lower is better
    // Deterministic tie-breakers: cumulative score then apiId
    const sa = a.score ?? 0;
    const sb = b.score ?? 0;
    if (sa !== sb) return sa - sb;
    return (a.apiId ?? 0) - (b.apiId ?? 0);
  });
}

/**
 * Convenience helper that returns the top-N golfers after applying rankForRound.
 *
 * Behavior
 * - If n > golfers.length, all ranked golfers are returned.
 * - If n <= 0, an empty array is returned.
 *
 * @param golfers Pool of golfers
 * @param round   Round number 1..4
 * @param live    Live (today-based) vs post (raw round-based) semantics
 * @param par     Course par
 * @param n       Number of golfers to keep from the top of the ranking
 * @returns The top-N golfers according to rankForRound
 */
export function pickTopNForRound(
  golfers: Golfer[],
  round: 1 | 2 | 3 | 4,
  live: boolean,
  par: number,
  n: number,
) {
  return rankForRound(golfers, round, live, par).slice(0, n);
}
