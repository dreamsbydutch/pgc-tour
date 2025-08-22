import type { TournamentWithRelations, TeamCalculation } from "./types";
import type { TourCard, Team } from "@prisma/client";
import {
  earliestTimeStr,
  isPlayoffTournament,
  roundContrib,
  roundDecimal,
  rawTeamTotals,
} from "./utils";
import { getTeamGolfers, getActive } from "./selection";
import { avgField } from "./aggregates";
import { type EventIndex, computeStartingStrokes } from "./playoffs";

/**
 * The build result is the list of per-team calculations paired with the team id,
 * which is used downstream to persist back to the DB.
 */
export type BuildResult = {
  teams: (TeamCalculation & { id: number })[];
};

// DRY: Precompute per-round post contributions and raw averages for a team
function precomputeTeamRounds(
  team: Team,
  tourCards: TourCard[],
  tournament: TournamentWithRelations,
  evIdx: EventIndex,
  par: number,
) {
  const r1Post = roundContrib(
    1,
    team,
    tourCards,
    tournament,
    evIdx,
    par,
    false,
  );
  const r2Post = roundContrib(
    2,
    team,
    tourCards,
    tournament,
    evIdx,
    par,
    false,
  );
  const r3Post = roundContrib(
    3,
    team,
    tourCards,
    tournament,
    evIdx,
    par,
    false,
  );
  const r4Post = roundContrib(
    4,
    team,
    tourCards,
    tournament,
    evIdx,
    par,
    false,
  );
  const {
    r1: r1Raw,
    r2: r2Raw,
    r3: r3Raw,
    r4: r4Raw,
  } = rawTeamTotals(team, tourCards, tournament, evIdx, par);
  return { r1Post, r2Post, r3Post, r4Post, r1Raw, r2Raw, r3Raw, r4Raw };
}

/**
 * Core calculation entry point for the update-teams job.
 */
export async function buildTeamCalculations(
  tournament: TournamentWithRelations,
  tourCards: TourCard[],
  carryInMap?: Record<string, number>,
  eventIndex?: EventIndex,
): Promise<BuildResult> {
  const isPlayoff = isPlayoffTournament(tournament);
  const par = tournament.course.par;
  const live = Boolean(tournament.livePlay);

  // Compute a result row for each team in the tournament snapshot
  const teams = tournament.teams.map((team) => {
    // Initialize an empty result row with sane defaults
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

    // Gather convenience lists and derive active golfers (not CUT)
    const teamGolfers = getTeamGolfers(team, tournament.golfers);
    const active = getActive(teamGolfers);

    // Derive earliest team tee-times
    const r1Times = teamGolfers.map((g) => g.roundOneTeeTime);
    const r2Times = teamGolfers.map((g) => g.roundTwoTeeTime);
    const r3Times = teamGolfers.map((g) => g.roundThreeTeeTime);
    const r4Times = teamGolfers.map((g) => g.roundFourTeeTime);
    const r = (tournament.currentRound ?? 1) as 1 | 2 | 3 | 4 | 5;
    result.roundOneTeeTime = earliestTimeStr(r1Times, 1);
    result.roundTwoTeeTime =
      earliestTimeStr(r2Times, 1) ?? result.roundTwoTeeTime;
    if (r >= 3) {
      const t3 = earliestTimeStr(r3Times, 6);
      if (t3) result.roundThreeTeeTime = t3;
    }
    if (r >= 4) {
      const t4 = earliestTimeStr(r4Times, 6);
      if (t4) result.roundFourTeeTime = t4;
    }

    // Unified logic: evIdx=0 for regular season; 1..3 for playoffs
    const evIdx: EventIndex = isPlayoff ? (eventIndex ?? 1) : 0;

    // Compute base: starting strokes (event 1) + carry-in (events 2/3), playoffs only
    let base = 0;
    if (isPlayoff) {
      const startingStrokes =
        evIdx === 1 ? computeStartingStrokes(team, tournament, tourCards) : 0;
      const carryIn = evIdx >= 2 ? (carryInMap?.[team.tourCardId] ?? 0) : 0;
      base = (startingStrokes ?? 0) + carryIn;
    }

    // Precompute round values
    const { r1Post, r2Post, r3Post, r4Post, r1Raw, r2Raw, r3Raw, r4Raw } =
      precomputeTeamRounds(team, tourCards, tournament, evIdx, par);

    // Regular season CUT check
    if (evIdx === 0 && r >= 3 && active.length < 5) {
      result.position = "CUT";
      result.roundOne = roundDecimal(r1Raw, 1);
      result.roundTwo = roundDecimal(r2Raw, 1);
      return result;
    }

    // Round-by-round scoreboard
    if (r === 1) {
      if (live) {
        const liveC = roundContrib(
          1,
          team,
          tourCards,
          tournament,
          evIdx,
          par,
          true,
        );
        result.today = roundDecimal(liveC.today, 1);
        result.thru = roundDecimal(liveC.thru ?? null, 1);
        result.score =
          evIdx === 0
            ? roundDecimal(avgField(teamGolfers, "score") ?? null, 1)
            : roundDecimal(base + liveC.today, 1);
      }
    } else if (r === 2) {
      result.roundOne = roundDecimal(r1Raw, 1);
      if (live) {
        const liveC = roundContrib(
          2,
          team,
          tourCards,
          tournament,
          evIdx,
          par,
          true,
        );
        result.today = roundDecimal(liveC.today, 1);
        result.thru = roundDecimal(liveC.thru ?? null, 1);
        result.score = roundDecimal(
          base + (r1Post.overPar ?? 0) + liveC.today,
          1,
        );
      } else {
        result.today = roundDecimal(r1Post.overPar, 1);
        result.thru = 18;
        result.score = roundDecimal(base + (r1Post.overPar ?? 0), 1);
      }
    } else if (r === 3) {
      result.roundOne = roundDecimal(r1Raw, 1);
      result.roundTwo = roundDecimal(r2Raw, 1);
      if (live) {
        const liveC = roundContrib(
          3,
          team,
          tourCards,
          tournament,
          evIdx,
          par,
          true,
        );
        result.today = roundDecimal(liveC.today, 1);
        result.thru = roundDecimal(liveC.thru ?? null, 1);
        result.score = roundDecimal(
          base + (r1Post.overPar ?? 0) + (r2Post.overPar ?? 0) + liveC.today,
          1,
        );
      } else {
        result.today = roundDecimal(r2Post.overPar, 1);
        result.thru = 18;
        result.score = roundDecimal(
          base + (r1Post.overPar ?? 0) + (r2Post.overPar ?? 0),
          1,
        );
      }
    } else if (r === 4) {
      result.roundOne = roundDecimal(r1Raw, 1);
      result.roundTwo = roundDecimal(r2Raw, 1);
      result.roundThree = roundDecimal(r3Raw, 1);
      if (live) {
        const liveC = roundContrib(
          4,
          team,
          tourCards,
          tournament,
          evIdx,
          par,
          true,
        );
        result.today = roundDecimal(liveC.today, 1);
        result.thru = roundDecimal(liveC.thru ?? null, 1);
        result.score = roundDecimal(
          base +
            (r1Post.overPar ?? 0) +
            (r2Post.overPar ?? 0) +
            (r3Post.overPar ?? 0) +
            liveC.today,
          1,
        );
      } else {
        result.today = roundDecimal(r3Post.overPar, 1);
        result.thru = 18;
        result.score = roundDecimal(
          base +
            (r1Post.overPar ?? 0) +
            (r2Post.overPar ?? 0) +
            (r3Post.overPar ?? 0),
          1,
        );
      }
    } else if (r === 5) {
      result.roundOne = roundDecimal(r1Raw, 1);
      result.roundTwo = roundDecimal(r2Raw, 1);
      result.roundThree = roundDecimal(r3Raw, 1);
      result.roundFour = roundDecimal(r4Raw, 1);
      result.today = roundDecimal(r4Post.overPar, 1);
      result.thru = 18;
      result.score = roundDecimal(
        base +
          (r1Post.overPar ?? 0) +
          (r2Post.overPar ?? 0) +
          (r3Post.overPar ?? 0) +
          (r4Post.overPar ?? 0),
        1,
      );
    }

    return result;
  });

  // ===================== PLAYOFF BRACKET POSITION ASSIGNMENT =====================
  // For playoffs only, we assign bracket-relative positions (gold/silver) based on score.
  let playoffByTeamId: Map<number, number | undefined> | undefined;
  if (isPlayoff) {
    playoffByTeamId = new Map<number, number | undefined>();
    for (const t of tournament.teams) {
      const tc = tourCards.find((c) => c.id === t.tourCardId);
      playoffByTeamId.set(t.id, tc?.playoff ?? 0);
    }

    const assignBracketPositions = (bracket: 1 | 2) => {
      const bracketTeamsAll = teams.filter(
        (t) => playoffByTeamId!.get(t.id) === bracket,
      );
      const withScore = bracketTeamsAll.filter(
        (t): t is (TeamCalculation & { id: number }) & { score: number } =>
          typeof t.score === "number",
      );

      withScore.sort((a, b) => a.score - b.score);

      let i = 0;
      while (i < withScore.length) {
        const score = withScore[i]!.score;
        let j = i + 1;
        while (j < withScore.length && withScore[j]!.score === score) j++;
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

    assignBracketPositions(1);
    assignBracketPositions(2);
  }

  // ===================== TIE-AWARE POINTS AND EARNINGS =====================
  const pointsArr = tournament.tier?.points ?? [];
  const payoutsArr = tournament.tier?.payouts ?? [];
  const parsePos = (pos?: string | null) => {
    const m = pos ? /\d+/.exec(pos) : null;
    return m ? parseInt(m[0], 10) : null;
  };
  const avgAwards = (arr: number[], start: number, count: number) => {
    let sum = 0;
    for (let i = 0; i < count; i++) sum += arr[start + i] ?? 0;
    return count > 0 ? sum / count : 0;
  };
  const awardPointsAndEarningsGroup = (
    group: (TeamCalculation & { id: number })[],
    offset: number,
  ) => {
    const byPos = new Map<number, (TeamCalculation & { id: number })[]>();
    for (const t of group) {
      const n = parsePos(t.position ?? null);
      if (!n || n <= 0) continue;
      const arr = byPos.get(n) ?? [];
      arr.push(t);
      byPos.set(n, arr);
    }
    const positions = Array.from(byPos.keys()).sort((a, b) => a - b);
    for (const p of positions) {
      const tiedTeams = byPos.get(p)!;
      const count = tiedTeams.length;
      const baseIdx = p - 1 + offset;
      const pts = avgAwards(pointsArr, baseIdx, count);
      const pay = avgAwards(payoutsArr, baseIdx, count);
      for (const t of tiedTeams) {
        t.points = roundDecimal(pts);
        t.earnings = roundDecimal(pay);
      }
    }
  };
  const awardEarningsGroupOnly = (
    group: (TeamCalculation & { id: number })[],
    offset: number,
  ) => {
    const byPos = new Map<number, (TeamCalculation & { id: number })[]>();
    for (const t of group) {
      const n = parsePos(t.position ?? null);
      if (!n || n <= 0) continue;
      const arr = byPos.get(n) ?? [];
      arr.push(t);
      byPos.set(n, arr);
    }
    const positions = Array.from(byPos.keys()).sort((a, b) => a - b);
    for (const p of positions) {
      const tiedTeams = byPos.get(p)!;
      const count = tiedTeams.length;
      const baseIdx = p - 1 + offset;
      const pay = avgAwards(payoutsArr, baseIdx, count);
      for (const t of tiedTeams) {
        // Playoffs: points remain 0
        t.points = 0;
        t.earnings = roundDecimal(pay);
      }
    }
  };

  if (isPlayoff) {
    // Reset playoff points to 0 for all teams
    for (const t of teams) t.points = 0;
    const isFinalPlayoff =
      (eventIndex ?? 1) === 3 && (tournament.currentRound ?? 1) === 5;
    if (isFinalPlayoff) {
      const bracket1 = teams.filter((t) => playoffByTeamId!.get(t.id) === 1);
      const bracket2 = teams.filter((t) => playoffByTeamId!.get(t.id) === 2);
      // Gold uses payouts 1-75 (offset 0), Silver uses 76-150 (offset 75)
      awardEarningsGroupOnly(bracket1, 0);
      awardEarningsGroupOnly(bracket2, 75);
    } else {
      // Not the final playoff event or not completed: ensure earnings are 0
      for (const t of teams) t.earnings = 0;
    }
  } else {
    // Regular season: always compute both points and earnings
    awardPointsAndEarningsGroup(teams, 0);
  }

  return { teams };
}
