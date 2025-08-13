/**
 * Playoff helpers used by the update-teams cron.
 *
 * Responsibilities
 * - Determine playoff event index (1/2/3) from tournament metadata
 * - Decide selection counts per event/round
 * - Identify a team's playoff bracket (gold/silver)
 * - Check team eligibility for a given round and event
 * - Compute team daily contribution (live and post semantics)
 * - Compute worst-of-day values for fallback when teams are ineligible
 */
import type { TournamentWithRelations } from "./types";
import type { Team, Golfer, TourCard } from "@prisma/client";
import { getTeamGolfers, getActive, pickTopNForRound } from "./selection";
import { avgOverPar, avgToday, avgThru } from "./aggregates";

/**
 * Playoff event index: 1, 2, or 3.
 */
export type EventIndex = 0 | 1 | 2 | 3;

/**
 * Get the selection count (number of contributing golfers) for a given
 * playoff event and round.
 *
 * Rules
 * - Event 1: rounds 1-2 = 10 golfers, rounds 3-4 = 5 golfers
 * - Event 2: all rounds = 5 golfers
 * - Event 3: all rounds = 3 golfers
 */
export function selectionCountFor(
  eventIndex: EventIndex,
  round: 1 | 2 | 3 | 4,
): number {
  if (eventIndex <= 1) return round <= 2 ? 10 : 5;
  if (eventIndex === 2) return 5;
  return 3;
}

/**
 * Determine a team's playoff bracket (gold or silver) based on its TourCard.
 *
 * Mapping
 * - TourCard.playoff: 1 = gold, 2 = silver, null/0 = not in playoffs
 */
export function getTeamBracket(
  team: Team,
  tourCards: TourCard[],
): "gold" | "silver" | null {
  const tc = tourCards.find((c) => c.id === team.tourCardId);
  const p = tc?.playoff ?? 0;
  return p === 2 ? "silver" : p === 1 ? "gold" : null;
}

/**
 * Determine if a team is eligible to score for the specified round/event.
 *
 * Eligibility
 * - Team must have at least the required number of active golfers (post-cut)
 * - Required is derived from selectionCountFor(eventIndex, round)
 *
 * Returns convenience fields used by callers.
 */
export function teamEligibleForRound(
  team: Team,
  golfers: Golfer[],
  eventIndex: EventIndex,
  round: 1 | 2 | 3 | 4,
) {
  const required = selectionCountFor(eventIndex, round);
  const teamGolfers = getTeamGolfers(team, golfers);
  const active = getActive(teamGolfers);
  const eligible = team.golferIds.length > 0 && active.length >= required;
  return { eligible, required, teamGolfers, active };
}

/**
 * Compute a team's daily contribution for a round.
 *
 * Behavior
 * - If the team is ineligible for the round, return null.
 * - If live = true: contribution.today is avgToday(pool), contribution.thru is avgThru(pool),
 *   and overPar mirrors today (live values are already relative to par).
 * - If live = false: use post semantics; compute overPar via avgOverPar on the
 *   selected pool and set thru to 18.
 *
 * Pooling
 * - n = selectionCountFor(eventIndex, round)
 * - If n >= 10, use all team golfers; otherwise select the top-N via pickTopNForRound
 */
export function computeTeamDailyContribution(
  team: Team,
  allGolfers: Golfer[],
  round: 1 | 2 | 3 | 4,
  live: boolean,
  eventIndex: EventIndex,
  par: number,
): { today: number; thru: number | null; overPar: number } | null {
  const {
    eligible,
    required: n,
    teamGolfers,
    active,
  } = teamEligibleForRound(team, allGolfers, eventIndex, round);
  if (!eligible) return null;
  const pool =
    n >= 10 ? teamGolfers : pickTopNForRound(active, round, live, par, n);
  if (live) {
    const today = avgToday(pool) ?? 0;
    const thru = avgThru(pool) ?? null;
    return { today, thru, overPar: today };
  }
  const key: "roundOne" | "roundTwo" | "roundThree" | "roundFour" =
    round === 1
      ? "roundOne"
      : round === 2
        ? "roundTwo"
        : round === 3
          ? "roundThree"
          : "roundFour";
  const overPar = avgOverPar(pool, key, par) ?? 0;
  return { today: overPar, thru: 18, overPar };
}

/**
 * Compute worst-of-day values for both brackets to be used as fallbacks
 * when teams do not meet eligibility requirements.
 *
 * Algorithm
 * - Iterate all teams, compute their contribution for the given round/mode
 * - Track the maximum (worst) today value separately for gold and silver
 * - Also record the corresponding thru values (live may be null)
 * - If a bracket has no eligible teams, default to 0 over-par (par) and
 *   thru = null (live) or 18 (post)
 */
export function computeWorstOfDay(
  t: TournamentWithRelations,
  tourCards: TourCard[],
  round: 1 | 2 | 3 | 4,
  live: boolean,
  eventIndex: EventIndex,
): {
  gold: { value: number; thru: number | null };
  silver: { value: number; thru: number | null };
} {
  const par = t.course.par;
  // Initialize to -Infinity so negatives are respected when everyone is under par
  let goldVal = Number.NEGATIVE_INFINITY,
    silverVal = Number.NEGATIVE_INFINITY;
  let goldThru: number | null = live ? null : 18,
    silverThru: number | null = live ? null : 18;
  for (const team of t.teams) {
    const bracket = getTeamBracket(team, tourCards);
    const contrib = computeTeamDailyContribution(
      team,
      t.golfers,
      round,
      live,
      eventIndex,
      par,
    );
    if (!contrib) continue;
    if (bracket === "gold") {
      if (contrib.today > goldVal) {
        goldVal = contrib.today;
        goldThru = contrib.thru;
      }
    } else {
      if (contrib.today > silverVal) {
        silverVal = contrib.today;
        silverThru = contrib.thru;
      }
    }
  }
  // If no eligible teams found in a bracket, default to par (0 over) for safety
  if (!Number.isFinite(goldVal)) {
    goldVal = 0;
    goldThru = live ? null : 18;
  }
  if (!Number.isFinite(silverVal)) {
    silverVal = 0;
    silverThru = live ? null : 18;
  }
  return {
    gold: { value: goldVal, thru: goldThru },
    silver: { value: silverVal, thru: silverThru },
  };
}

/**
 * Compute Event 1 starting strokes for a team within its bracket.
 *
 * Rules
 * - Use only participating tour cards in the current tournament and same bracket.
 * - Sort by season points descending.
 * - Starting strokes = strokes[better] where better = count of higher-point cards.
 * - For ties on points, average the slice of stroke values across the tied positions.
 * - Gold uses first 30 stroke entries; Silver uses first 40.
 */
export function computeStartingStrokes(
  team: Team,
  tournament: TournamentWithRelations,
  tourCards: TourCard[],
): number {
  const bracket = getTeamBracket(team, tourCards);
  if (!bracket) return 0;
  const participantIds = new Set(
    (tournament.teams ?? []).map((t) => t.tourCardId),
  );
  const bracketFlag = bracket === "gold" ? 1 : 2;
  const group = tourCards.filter(
    (c) => participantIds.has(c.id) && (c.playoff ?? 0) === bracketFlag,
  );
  const sorted = [...group].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const me = sorted.find((c) => c.id === team.tourCardId);
  if (!me) return 0;
  const myPts = me.points ?? 0;
  const better = sorted.filter((c) => (c.points ?? 0) > myPts).length;
  const tied = sorted.filter((c) => (c.points ?? 0) === myPts).length;
  const pointsArr = tournament.tier?.points ?? [];
  const strokes =
    bracket === "gold" ? pointsArr.slice(0, 30) : pointsArr.slice(0, 40);
  if (tied > 1) {
    const slice = strokes.slice(better, better + tied);
    const sum = slice.reduce((a, b) => a + (b ?? 0), 0);
    const avg = tied > 0 ? sum / tied : 0;
    return Math.round(avg * 10) / 10;
  }
  return strokes[better] ?? 0;
}
