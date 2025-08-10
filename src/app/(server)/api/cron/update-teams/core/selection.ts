import type { Team, Golfer } from "@prisma/client";
import { isCutStatus } from "./utils";

export function getTeamGolfers(team: Team, all: Golfer[]) {
  return all.filter((g) => team.golferIds.includes(g.apiId));
}

export function getActive(golfers: Golfer[]) {
  return golfers.filter((g) => !isCutStatus(g.position ?? null));
}

export function rankForRound(
  golfers: Golfer[],
  round: 1 | 2 | 3 | 4,
  live: boolean,
  par: number,
): Golfer[] {
  const key =
    round === 1
      ? "roundOne"
      : round === 2
        ? "roundTwo"
        : round === 3
          ? "roundThree"
          : "roundFour";
  return [...golfers].sort((a, b) => {
    const va = live ? (a.today ?? 0) : ((a as any)[key] ?? 0) - par;
    const vb = live ? (b.today ?? 0) : ((b as any)[key] ?? 0) - par;
    if (va !== vb) return va - vb; // lower is better
    // tie-breakers: cumulative score then apiId
    const sa = a.score ?? 0;
    const sb = b.score ?? 0;
    if (sa !== sb) return sa - sb;
    return (a.apiId ?? 0) - (b.apiId ?? 0);
  });
}

export function pickTopNForRound(
  golfers: Golfer[],
  round: 1 | 2 | 3 | 4,
  live: boolean,
  par: number,
  n: number,
) {
  return rankForRound(golfers, round, live, par).slice(0, n);
}
