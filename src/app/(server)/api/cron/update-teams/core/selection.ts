import type { Team, Golfer } from "@prisma/client";
import { isCutStatus } from "./utils";

export function getTeamGolfers(team: Team, all: Golfer[]) {
  return all.filter((g) => team.golferIds.includes(g.apiId));
}

export function getActive(golfers: Golfer[]) {
  return golfers.filter((g) => !isCutStatus(g.position ?? null));
}

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
