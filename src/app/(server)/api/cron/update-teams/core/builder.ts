import type { TournamentWithRelations, TeamCalculation } from "./types";
import type { Golfer, TourCard } from "@prisma/client";
import { roundDecimal } from "./utils";
import { getTeamGolfers, getActive, pickTopNForRound } from "./selection";
import { avgOverPar, avgToday, avgThru } from "./aggregates";
import {
  selectionCountFor,
  computeTeamDailyContribution,
  computeWorstOfDay,
  getTeamBracket,
  teamEligibleForRound,
  type EventIndex,
} from "./playoffs";

// Simple playoff detection based on tier name
function isPlayoffTournament(tournament: TournamentWithRelations): boolean {
  const tierName = (tournament.tier?.name ?? "").toLowerCase();
  const tourneyName = (tournament.name ?? "").toLowerCase();
  return tierName.includes("playoff") || tourneyName.includes("playoff");
}

function earliestTimeStr(
  times: Array<string | null | undefined>,
): string | null {
  const valid = times.filter((t): t is string => Boolean(t && t.trim().length));
  if (!valid.length) return null;
  // Prefer ISO/HH:MM parsing if possible; fallback to lexicographically smallest
  try {
    const parsed = valid
      .map((t) => ({ t, d: new Date(t).getTime() }))
      .filter(({ d }) => !Number.isNaN(d));
    if (parsed.length === valid.length && parsed.length > 0) {
      parsed.sort((a, b) => a.d - b.d);
      return parsed[0]?.t ?? null;
    }
  } catch {
    // ignore
  }
  return valid.sort()[0] ?? null;
}

type RoundKey = Extract<
  keyof Golfer,
  "roundOne" | "roundTwo" | "roundThree" | "roundFour"
>;
function avgRawRound(golfers: Golfer[], roundKey: RoundKey): number | null {
  const vals = golfers
    .map((g) => g[roundKey])
    .filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function roundKeyFor(
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

// Local avg helper
function avg(values: number[] | null): number | null {
  if (!values || !values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export type BuildResult = {
  teams: (TeamCalculation & { id: number })[];
};

export async function buildTeamCalculations(
  tournament: TournamentWithRelations,
  tourCards: TourCard[],
  carryInMap?: Record<string, number>,
  eventIndex?: EventIndex,
): Promise<BuildResult> {
  const isPlayoff = isPlayoffTournament(tournament);
  const par = tournament.course.par;
  const live = Boolean(tournament.livePlay);

  const teams = tournament.teams.map((team) => {
    const result: TeamCalculation & { id: number } = {
      id: team.id,
      round: tournament.currentRound ?? 1,
      roundOne: null,
      roundTwo: null,
      roundThree: null,
      roundFour: null,
      today: null,
      thru: null,
      score: null,
      position: team.position ?? null,
      pastPosition: team.pastPosition ?? null,
      points: 0,
      earnings: 0,
      roundOneTeeTime: null,
      roundTwoTeeTime: null,
      roundThreeTeeTime: null,
      roundFourTeeTime: null,
    };

    const teamGolfers = getTeamGolfers(team, tournament.golfers);
    const active = getActive(teamGolfers);

    // Populate team tee times if source golfer tee times are available
    const r1Times = teamGolfers.map((g) => g.roundOneTeeTime);
    const r2Times = teamGolfers.map((g) => g.roundTwoTeeTime);
    const r3Times = teamGolfers.map((g) => g.roundThreeTeeTime);
    const r4Times = teamGolfers.map((g) => g.roundFourTeeTime);
    const r = (tournament.currentRound ?? 1) as 1 | 2 | 3 | 4 | 5;
    // R1 and often R2 are known at tournament start
    result.roundOneTeeTime = earliestTimeStr(r1Times);
    result.roundTwoTeeTime = earliestTimeStr(r2Times) ?? result.roundTwoTeeTime;
    // R3 known after R2 ends; set when data appears
    if (r >= 3) {
      const t3 = earliestTimeStr(r3Times);
      if (t3) result.roundThreeTeeTime = t3;
    }
    // R4 known after R3 ends; set when data appears
    if (r >= 4) {
      const t4 = earliestTimeStr(r4Times);
      if (t4) result.roundFourTeeTime = t4;
    }

    if (!isPlayoff) {
      // Regular season
      const r = tournament.currentRound ?? 1;
      if (r === 1) {
        if (live) {
          result.today = roundDecimal(avgToday(teamGolfers) ?? null);
          result.thru = roundDecimal(avgThru(teamGolfers) ?? null);
          result.score = roundDecimal(
            avg(teamGolfers.map((g) => g.score ?? 0)) ?? null,
          );
        }
      } else if (r === 2) {
        // roundOne is raw average of round one strokes across all 10
        result.roundOne = roundDecimal(avgRawRound(teamGolfers, "roundOne"));
        if (live) {
          result.today = roundDecimal(avgToday(teamGolfers));
          result.thru = roundDecimal(avgThru(teamGolfers));
          const r1ov = avgOverPar(teamGolfers, "roundOne", par) ?? 0;
          const tdy = avgToday(teamGolfers) ?? 0;
          result.score = roundDecimal(r1ov + tdy);
        } else {
          const r1ov = avgOverPar(teamGolfers, "roundOne", par);
          result.today = roundDecimal(r1ov);
          result.thru = 18;
          result.score = roundDecimal(r1ov);
        }
      } else if (r === 3) {
        result.roundOne = roundDecimal(avgRawRound(teamGolfers, "roundOne"));
        result.roundTwo = roundDecimal(avgRawRound(teamGolfers, "roundTwo"));
        if (active.length < 5) {
          // Regular season cut
          result.position = "CUT";
          return result;
        }
        if (live) {
          const top5 = pickTopNForRound(active, 3, true, par, 5);
          result.today = roundDecimal(avgToday(top5));
          result.thru = roundDecimal(avgThru(top5));
          const r1ov = avgOverPar(teamGolfers, "roundOne", par) ?? 0;
          const r2ov = avgOverPar(teamGolfers, "roundTwo", par) ?? 0;
          const tdy = avgToday(top5) ?? 0;
          result.score = roundDecimal(r1ov + r2ov + tdy);
        } else {
          const r2ovVal = avgOverPar(teamGolfers, "roundTwo", par);
          result.today = roundDecimal(r2ovVal);
          result.thru = 18;
          const r1ov = avgOverPar(teamGolfers, "roundOne", par) ?? 0;
          const r2ovNum = r2ovVal ?? 0;
          result.score = roundDecimal(r1ov + r2ovNum);
        }
      } else if (r === 4 || r === 5) {
        result.roundOne = roundDecimal(avgRawRound(teamGolfers, "roundOne"));
        result.roundTwo = roundDecimal(avgRawRound(teamGolfers, "roundTwo"));
        if (active.length < 5) {
          result.position = "CUT";
          return result;
        }
        const top5r3 = pickTopNForRound(active, 3, false, par, 5);
        result.roundThree = roundDecimal(avgRawRound(top5r3, "roundThree"));
        if (r === 4) {
          if (live) {
            const top5r4 = pickTopNForRound(active, 4, true, par, 5);
            result.today = roundDecimal(avgToday(top5r4));
            result.thru = roundDecimal(avgThru(top5r4));
            const r1ov = avgOverPar(teamGolfers, "roundOne", par) ?? 0;
            const r2ov = avgOverPar(teamGolfers, "roundTwo", par) ?? 0;
            const r3ov = avgOverPar(top5r3, "roundThree", par) ?? 0;
            const tdy = avgToday(top5r4) ?? 0;
            result.score = roundDecimal(r1ov + r2ov + r3ov + tdy);
          } else {
            const r3ov = avgOverPar(top5r3, "roundThree", par);
            result.today = roundDecimal(r3ov);
            result.thru = 18;
            const r1ov = avgOverPar(teamGolfers, "roundOne", par) ?? 0;
            const r2ov = avgOverPar(teamGolfers, "roundTwo", par) ?? 0;
            result.score = roundDecimal(r1ov + r2ov + (r3ov ?? 0));
          }
        } else if (r === 5) {
          const top5r4 = pickTopNForRound(active, 4, false, par, 5);
          result.roundFour = roundDecimal(avgRawRound(top5r4, "roundFour"));
          result.today = roundDecimal(avgOverPar(top5r4, "roundFour", par));
          result.thru = 18;
          const r1ov = avgOverPar(teamGolfers, "roundOne", par) ?? 0;
          const r2ov = avgOverPar(teamGolfers, "roundTwo", par) ?? 0;
          const r3ov = avgOverPar(top5r3, "roundThree", par) ?? 0;
          const r4ov = avgOverPar(top5r4, "roundFour", par) ?? 0;
          result.score = roundDecimal(r1ov + r2ov + r3ov + r4ov);
        }
      }
    } else {
      // Playoffs per README: starting strokes (Event 1), carry-in (Events 2/3),
      // per-round selection counts, no CUTs, worst-of-day fallback within bracket.
      const r = (tournament.currentRound ?? 1) as 1 | 2 | 3 | 4 | 5;
      const evIdx: EventIndex = eventIndex ?? 1;

      // Determine carry-in from provided map (prior event total), default 0 when missing
      const carryIn = carryInMap?.[team.tourCardId] ?? 0;

      // Starting strokes for Event 1 only, rank within this event by tourCard.points
      // Gold: rank 1..30; Silver: rank 1..40. Tie-average across identical points.
      let startingStrokes = 0;
      if (evIdx === 1) {
        const bracket = getTeamBracket(team, tourCards);
        const participantIds = new Set(
          (tournament.teams ?? []).map((t) => t.tourCardId),
        );
        const bracketFlag = bracket === "gold" ? 1 : 2;
        const group = tourCards.filter(
          (c) => participantIds.has(c.id) && (c.playoff ?? 0) === bracketFlag,
        );
        const sorted = [...group].sort(
          (a, b) => (b.points ?? 0) - (a.points ?? 0),
        );
        const me = sorted.find((c) => c.id === team.tourCardId);
        if (me) {
          const myPts = me.points ?? 0;
          const better = sorted.filter((c) => (c.points ?? 0) > myPts).length;
          const tied = sorted.filter((c) => (c.points ?? 0) === myPts).length;
          const pointsArr = tournament.tier?.points ?? [];
          // Gold uses positions 1..30 from the shared strokes table
          // Silver uses positions 1..40 from the same strokes table
          const strokes =
            bracket === "gold"
              ? pointsArr.slice(0, 30)
              : pointsArr.slice(0, 40);
          if (tied > 1) {
            const slice = strokes.slice(better, better + tied);
            const sum = slice.reduce((a, b) => a + (b ?? 0), 0);
            const avg = tied > 0 ? sum / tied : 0;
            startingStrokes = Math.round(avg * 10) / 10;
          } else {
            startingStrokes = strokes[better] ?? 0;
          }
        } else {
          startingStrokes = 0;
        }
      }

      const base = (startingStrokes ?? 0) + carryIn;

      // Helpers to compute per-round contributions and raw round averages (post) with fallback
      const roundContrib = (roundNum: 1 | 2 | 3 | 4, wantLive: boolean) => {
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
        const value =
          bracket === "gold" ? worst.gold.value : worst.silver.value;
        const thru = bracket === "gold" ? worst.gold.thru : worst.silver.thru;
        return { today: value, thru: thru, overPar: value };
      };

      const rawRoundPost = (roundNum: 1 | 2 | 3 | 4): number | null => {
        const info = teamEligibleForRound(
          team,
          tournament.golfers,
          evIdx,
          roundNum,
        );
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
          const over =
            bracket === "gold" ? worst.gold.value : worst.silver.value;
          return (over ?? 0) + par;
        }
        const pool =
          n >= 10
            ? info.teamGolfers
            : pickTopNForRound(info.active, roundNum, false, par, n);
        const key = roundKeyFor(roundNum);
        return avgRawRound(pool, key);
      };

      // Precompute completed-round over-par averages and raw averages (post semantics) for R1..R4
      const r1Post = roundContrib(1, false);
      const r2Post = roundContrib(2, false);
      const r3Post = roundContrib(3, false);
      const r4Post = roundContrib(4, false);
      const r1Raw = rawRoundPost(1);
      const r2Raw = rawRoundPost(2);
      const r3Raw = rawRoundPost(3);
      const r4Raw = rawRoundPost(4);

      if (r === 1) {
        if (live) {
          const liveC = roundContrib(1, true);
          result.today = roundDecimal(liveC.today);
          result.thru = roundDecimal(liveC.thru ?? null);
          result.score = roundDecimal(base + liveC.today);
        }
      } else if (r === 2) {
        // Set round 1 raw value
        result.roundOne = roundDecimal(r1Raw);
        if (live) {
          const liveC = roundContrib(2, true);
          result.today = roundDecimal(liveC.today);
          result.thru = roundDecimal(liveC.thru ?? null);
          result.score = roundDecimal(
            base + (r1Post.overPar ?? 0) + liveC.today,
          );
        } else {
          result.today = roundDecimal(r1Post.overPar);
          result.thru = 18;
          result.score = roundDecimal(base + (r1Post.overPar ?? 0));
        }
      } else if (r === 3) {
        result.roundOne = roundDecimal(r1Raw);
        result.roundTwo = roundDecimal(r2Raw);
        if (live) {
          const liveC = roundContrib(3, true);
          result.today = roundDecimal(liveC.today);
          result.thru = roundDecimal(liveC.thru ?? null);
          result.score = roundDecimal(
            base + (r1Post.overPar ?? 0) + (r2Post.overPar ?? 0) + liveC.today,
          );
        } else {
          result.today = roundDecimal(r2Post.overPar);
          result.thru = 18;
          result.score = roundDecimal(
            base + (r1Post.overPar ?? 0) + (r2Post.overPar ?? 0),
          );
        }
      } else if (r === 4) {
        result.roundOne = roundDecimal(r1Raw);
        result.roundTwo = roundDecimal(r2Raw);
        result.roundThree = roundDecimal(r3Raw);
        if (live) {
          const liveC = roundContrib(4, true);
          result.today = roundDecimal(liveC.today);
          result.thru = roundDecimal(liveC.thru ?? null);
          result.score = roundDecimal(
            base +
              (r1Post.overPar ?? 0) +
              (r2Post.overPar ?? 0) +
              (r3Post.overPar ?? 0) +
              liveC.today,
          );
        } else {
          result.today = roundDecimal(r3Post.overPar);
          result.thru = 18;
          result.score = roundDecimal(
            base +
              (r1Post.overPar ?? 0) +
              (r2Post.overPar ?? 0) +
              (r3Post.overPar ?? 0),
          );
        }
      } else if (r === 5) {
        // Post tournament
        result.roundOne = roundDecimal(r1Raw);
        result.roundTwo = roundDecimal(r2Raw);
        result.roundThree = roundDecimal(r3Raw);
        result.roundFour = roundDecimal(r4Raw);
        result.today = roundDecimal(r4Post.overPar);
        result.thru = 18;
        result.score = roundDecimal(
          base +
            (r1Post.overPar ?? 0) +
            (r2Post.overPar ?? 0) +
            (r3Post.overPar ?? 0) +
            (r4Post.overPar ?? 0),
        );

        // Apply Event 3 payouts based on final bracket position
        if (evIdx === 3) {
          const payouts = tournament.tier?.payouts ?? [];
          const posStr = team.position ?? null;
          const regex = /\d+/;
          const match = posStr ? regex.exec(posStr) : null;
          const pos = match ? parseInt(match[0], 10) : NaN;
          if (!Number.isNaN(pos) && pos > 0) {
            const bracket = getTeamBracket(team, tourCards);
            const baseIdx = pos - 1; // 0-based within bracket
            const idx = bracket === "gold" ? baseIdx : 75 + baseIdx;
            result.earnings = payouts[idx] ?? 0;
          } else {
            result.earnings = 0;
          }
        }
      }

      // Policy: Event 1 & 2 -> points=0, earnings=0 unless Event 3 case above
      result.points = 0;
      if (evIdx !== 3) {
        result.earnings = 0;
      }
    }

    return result;
  });

  // For playoffs: assign positions within playoff bracket (gold/silver)
  if (isPlayoff) {
    const playoffByTeamId = new Map<number, number | undefined>();
    for (const t of tournament.teams) {
      const tc = tourCards.find((c) => c.id === t.tourCardId);
      playoffByTeamId.set(t.id, tc?.playoff ?? 0);
    }

    const assignBracketPositions = (bracket: 1 | 2) => {
      const bracketTeamsAll = teams.filter(
        (t) => playoffByTeamId.get(t.id) === bracket,
      );
      const withScore = bracketTeamsAll.filter(
        (t): t is (TeamCalculation & { id: number }) & { score: number } =>
          typeof t.score === "number",
      );

      // Sort ascending by score (lower is better)
      withScore.sort((a, b) => a.score - b.score);

      // Walk through sorted list and assign tie-aware positions
      let i = 0;
      while (i < withScore.length) {
        const score = withScore[i]!.score;
        let j = i + 1;
        while (j < withScore.length && withScore[j]!.score === score) {
          j++;
        }
        const tieCount = j - i;
        const label = (tieCount > 1 ? "T" : "") + (i + 1);
        for (let k = i; k < j; k++) {
          const teamId = withScore[k]!.id;
          const target = teams.find((t) => t.id === teamId);
          if (target) target.position = label;
        }
        i = j;
      }
    };

    assignBracketPositions(1); // Gold
    assignBracketPositions(2); // Silver
  }

  return { teams };
}
