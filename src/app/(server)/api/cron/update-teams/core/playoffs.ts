import type { TournamentWithRelations } from "./types";
import type { Team, Golfer, TourCard } from "@prisma/client";
import { getTeamGolfers, getActive, pickTopNForRound } from "./selection";
import { avgOverPar, avgToday, avgThru } from "./aggregates";

export type EventIndex = 1 | 2 | 3;

export function getEventIndex(t: TournamentWithRelations): EventIndex {
  const name = (t.name ?? "").toLowerCase();
  const tierName = (t.tier?.name ?? "").toLowerCase();
  const eventPos = (() => {
    const e = name.indexOf("event");
    const p = name.indexOf("playoff");
    if (e === -1 && p === -1) return -1;
    if (e === -1) return p;
    if (p === -1) return e;
    return Math.min(e, p);
  })();
  const pos3 = name.indexOf("3");
  const pos2 = name.indexOf("2");
  if ((eventPos !== -1 && pos3 > eventPos) || tierName.includes("3")) return 3;
  if ((eventPos !== -1 && pos2 > eventPos) || tierName.includes("2")) return 2;
  return 1;
}

export function selectionCountFor(
  eventIndex: EventIndex,
  round: 1 | 2 | 3 | 4,
): number {
  if (eventIndex === 1) return round <= 2 ? 10 : 5;
  if (eventIndex === 2) return 5;
  return 3;
}

export function getTeamBracket(
  team: Team,
  tourCards: TourCard[],
): "gold" | "silver" {
  const tc = tourCards.find((c) => c.id === team.tourCardId);
  const p = tc?.playoff ?? 0;
  return p === 2 ? "silver" : "gold";
}

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

export function computeTeamDailyContribution(
  team: Team,
  allGolfers: Golfer[],
  round: 1 | 2 | 3 | 4,
  live: boolean,
  eventIndex: EventIndex,
  par: number,
): { today: number; thru: number | null; overPar: number } | null {
  const { eligible, teamGolfers, active } = teamEligibleForRound(
    team,
    allGolfers,
    eventIndex,
    round,
  );
  if (!eligible) return null;
  const n = selectionCountFor(eventIndex, round);
  const pool =
    n >= 10 ? teamGolfers : pickTopNForRound(active, round, live, par, n);
  if (live) {
    const today = avgToday(pool) ?? 0;
    const thru = avgThru(pool) ?? null;
    return { today, thru, overPar: today };
  }
  type RoundKey = Extract<
    keyof Golfer,
    "roundOne" | "roundTwo" | "roundThree" | "roundFour"
  >;
  const key: RoundKey =
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
