/**
 * REFACTORED CRON JOB FOR TEAM SCORING UPDATES
 * ============================================
 *
 * This cron job updates team scores for the current tournament based on golfer performance.
 *
 * BUSINESS RULES:
 * - Rounds 1-2: Use ALL golfers on the team for scoring
 * - Rounds 3-4: Use TOP 5 golfers based on individual round scores (if team has ≥5 golfers)
 * - Teams with <5 golfers in rounds 3-4 are marked as "CUT"
 *
 * SCORING LOGIC:
 * - Round scores are calculated as averages of relevant golfers
 * - Total score is cumulative relative to par across all completed rounds
 * - Today's score reflects the current round being played (live) or most recent completed round
 * - Positions are calculated within each tour, with ties properly handled
 *
 * FEATURES:
 * - Clean separation of concerns with focused functions
 * - Proper TypeScript typing throughout
 * - Error handling and validation
 * - Support for both live and non-live play modes
 * - Accurate tee time assignments
 * - Points and earnings calculation for completed tournaments
 *
 * ENDPOINTS:
 * - Production: https://www.pgctour.ca/api/cron/update-teams
 * - Development: http://localhost:3000/api/cron/update-teams
 */

"use server";

import { api } from "@trpcLocal/server";
import type {
  Course,
  Golfer,
  Team,
  Tournament,
  Tier,
  TourCard,
} from "@prisma/client";
import { NextResponse } from "next/server";

type TournamentWithCourse = Tournament & { course: Course };
type TeamWithScoring = Team & {
  golfers: Golfer[];
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  try {
    const tournament = (await api.tournament.getInfo()).current;
    if (!tournament) {
      return NextResponse.redirect(`${origin}/`);
    }

    const golfers = await api.golfer.getByTournament({
      tournamentId: tournament.id,
    });

    const teams = await api.team.getByTournament({
      tournamentId: tournament.id,
    });

    // Update all teams with new scoring data
    await updateAllTeams(teams, tournament, golfers);

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error("Error updating teams:", error);
    return NextResponse.json(
      { error: "Failed to update teams" },
      { status: 500 },
    );
  }
}

/*─────────────────────────────────────────────────────────────*
 *                   CORE UPDATE FUNCTIONS                     *
 *─────────────────────────────────────────────────────────────*/

/**
 * Updates all teams for the current tournament
 */
async function updateAllTeams(
  teams: Team[],
  tournament: TournamentWithCourse,
  golfers: Golfer[],
): Promise<void> {
  const teamsWithGolfers = teams.map((team) => ({
    ...team,
    golfers: golfers.filter((golfer) => team.golferIds.includes(golfer.apiId)),
  }));

  const updatedTeams = teamsWithGolfers.map((team) =>
    calculateTeamScoring(team, tournament),
  );

  await updateTeamPositionsAndPrizes(updatedTeams, tournament);
}

/**
 * Calculates all scoring data for a team based on tournament rules
 */
function calculateTeamScoring(
  team: TeamWithScoring,
  tournament: TournamentWithCourse,
): Team {
  const currentRound = tournament.currentRound ?? 1;
  const par = tournament.course.par;

  const updatedTeam: Team = {
    ...team,
    round: currentRound,
  };

  // Update tee times
  updateTeeTimes(updatedTeam, team.golfers);

  // Calculate round scores based on current round and rules
  const roundScores = calculateRoundScores(team.golfers, currentRound, par);

  // Update team with calculated scores
  Object.assign(updatedTeam, roundScores);

  // Check if team should be cut (only after round 2 and < 5 active golfers)
  const activeGolfers = team.golfers.filter((g) => !isGolferCut(g));
  const shouldBeCut = currentRound > 2 && activeGolfers.length < 5;

  // Debug logging to help troubleshoot
  console.log(
    `Team ${team.tourCardId}: ${team.golfers.length} total golfers, ${activeGolfers.length} active golfers`,
  );
  console.log(`Current round: ${currentRound}, Should be cut: ${shouldBeCut}`);

  if (team.golfers.length > 0) {
    const cutGolfers = team.golfers.filter((g) => isGolferCut(g));
    console.log(
      `Cut golfers:`,
      cutGolfers.map((g) => ({ id: g.apiId, position: g.position })),
    );
  }

  if (shouldBeCut) {
    // Team is cut - set current scores to null and position to CUT
    updatedTeam.score = calculateTotalScore(roundScores, par); // Keep score from completed rounds
    updatedTeam.today = null;
    updatedTeam.thru = null;
    updatedTeam.position = "CUT";
    updatedTeam.pastPosition = "CUT";
    // Don't calculate rounds 3-4 for cut teams
    updatedTeam.roundThree = null;
    updatedTeam.roundFour = null;
    return updatedTeam;
  }

  // Calculate overall score and today's score
  const totalScore = calculateTotalScore(roundScores, par);
  const todayScore = calculateTodayScore(
    roundScores,
    currentRound,
    par,
    tournament.livePlay ?? false,
  );

  updatedTeam.score = roundToOneDecimal(totalScore);
  updatedTeam.today = roundToOneDecimal(todayScore);
  updatedTeam.thru = calculateThru(
    team.golfers,
    currentRound,
    tournament.livePlay ?? false,
  );

  return updatedTeam;
}

/**
 * Calculates scores for each round based on tournament rules
 */
function calculateRoundScores(
  golfers: Golfer[],
  currentRound: number,
  par: number,
): Pick<Team, "roundOne" | "roundTwo" | "roundThree" | "roundFour"> {
  const scores = {
    roundOne: null as number | null,
    roundTwo: null as number | null,
    roundThree: null as number | null,
    roundFour: null as number | null,
  };

  // Debug logging for score calculation
  console.log(
    `Calculating scores for ${golfers.length} golfers in round ${currentRound}`,
  );

  // Round 1: All 10 golfers (with WD/DQ penalty)
  if (currentRound >= 1) {
    const round1Scores = golfers.map((g) =>
      getGolferRoundScore(g, "roundOne", par),
    );
    const validScores = round1Scores.filter((score) => score !== null);
    if (validScores.length > 0) {
      scores.roundOne =
        validScores.reduce((sum, score) => sum + score!, 0) /
        validScores.length;
    }
  }

  // Round 2: All 10 golfers (with WD/DQ penalty)
  if (currentRound >= 2) {
    const round2Scores = golfers.map((g) =>
      getGolferRoundScore(g, "roundTwo", par),
    );
    const validScores = round2Scores.filter((score) => score !== null);
    if (validScores.length > 0) {
      scores.roundTwo =
        validScores.reduce((sum, score) => sum + score!, 0) /
        validScores.length;
    }
  }

  // Round 3: Top 5 golfers only (only if team has 5+ active golfers)
  if (currentRound >= 3) {
    const activeGolfers = golfers.filter((g) => !isGolferCut(g));
    console.log(
      `Round 3+ logic: Need 5+ active golfers, have ${activeGolfers.length}`,
    );

    if (activeGolfers.length >= 5) {
      const round3Scores = activeGolfers
        .map((g) => ({
          golfer: g,
          score: getGolferRoundScore(g, "roundThree", par),
        }))
        .filter((item) => item.score !== null)
        .sort((a, b) => a.score! - b.score!)
        .slice(0, 5);

      if (round3Scores.length > 0) {
        scores.roundThree =
          round3Scores.reduce((sum, item) => sum + item.score!, 0) /
          round3Scores.length;
      }
    }
  }

  // Round 4: Top 5 golfers only (only if team has 5+ active golfers)
  if (currentRound >= 4) {
    const activeGolfers = golfers.filter((g) => !isGolferCut(g));

    if (activeGolfers.length >= 5) {
      const round4Scores = activeGolfers
        .map((g) => ({
          golfer: g,
          score: getGolferRoundScore(g, "roundFour", par),
        }))
        .filter((item) => item.score !== null)
        .sort((a, b) => a.score! - b.score!)
        .slice(0, 5);

      if (round4Scores.length > 0) {
        scores.roundFour =
          round4Scores.reduce((sum, item) => sum + item.score!, 0) /
          round4Scores.length;
      }
    }
  }

  return scores;
}

/**
 * Gets a golfer's score for a specific round, applying WD/DQ penalties
 */
function getGolferRoundScore(
  golfer: Golfer,
  roundKey: keyof Golfer,
  par: number,
): number | null {
  const score = golfer[roundKey] as number | null;

  // If golfer has a score, return it
  if (score !== null) {
    return score;
  }

  // Check if golfer was WD or DQ - if so, apply +8 penalty
  const position = golfer.position?.toUpperCase();
  if (position === "WD" || position === "DQ") {
    return par + 8;
  }

  // If golfer is CUT, they don't get a penalty for missing rounds (they were cut)
  if (position === "CUT") {
    return null;
  }

  // No score available and not WD/DQ/CUT
  return null;
}

/**
 * Checks if a golfer is cut, withdrawn, or disqualified
 */
function isGolferCut(golfer: Golfer): boolean {
  const position = golfer.position?.toUpperCase();
  return position === "CUT" || position === "WD" || position === "DQ";
}

/**
 * Gets the top N golfers based on their score for a specific round
 */
function getTopGolfers(
  golfers: Golfer[],
  roundKey: keyof Golfer,
  count: number,
): Golfer[] {
  return golfers
    .filter((g) => g[roundKey] !== null)
    .sort((a, b) => (a[roundKey] as number) - (b[roundKey] as number))
    .slice(0, count);
}

/**
 * Calculates the average score for a group of golfers for a specific round
 */
function calculateAverageScore(
  golfers: Golfer[],
  roundKey: keyof Golfer,
  defaultScore: number,
): number {
  if (golfers.length === 0) return defaultScore + 8; // Default penalty

  const total = golfers.reduce((sum, golfer) => {
    const score = golfer[roundKey] as number;
    return sum + (score ?? defaultScore + 8);
  }, 0);

  return total / golfers.length;
}

/**
 * Calculates the total score relative to par
 */
function calculateTotalScore(
  roundScores: Pick<Team, "roundOne" | "roundTwo" | "roundThree" | "roundFour">,
  par: number,
): number | null {
  let total = 0;
  let roundsPlayed = 0;

  if (roundScores.roundOne !== null) {
    total += roundScores.roundOne - par;
    roundsPlayed++;
  }
  if (roundScores.roundTwo !== null) {
    total += roundScores.roundTwo - par;
    roundsPlayed++;
  }
  if (roundScores.roundThree !== null) {
    total += roundScores.roundThree - par;
    roundsPlayed++;
  }
  if (roundScores.roundFour !== null) {
    total += roundScores.roundFour - par;
    roundsPlayed++;
  }

  return roundsPlayed > 0 ? total : null;
}

/**
 * Calculates today's score based on current round and live play status
 */
function calculateTodayScore(
  roundScores: Pick<Team, "roundOne" | "roundTwo" | "roundThree" | "roundFour">,
  currentRound: number,
  par: number,
  isLivePlay: boolean = false,
): number | null {
  if (!isLivePlay) {
    // For non-live play, today's score is the most recent completed round relative to par
    switch (currentRound) {
      case 1:
        return roundScores.roundOne ? roundScores.roundOne - par : null;
      case 2:
        return roundScores.roundTwo ? roundScores.roundTwo - par : null;
      case 3:
        return roundScores.roundThree ? roundScores.roundThree - par : null;
      case 4:
        return roundScores.roundFour ? roundScores.roundFour - par : null;
      default:
        return null;
    }
  }

  // For live play, today's score depends on the current round being played
  switch (currentRound) {
    case 1:
      return roundScores.roundOne ? roundScores.roundOne - par : null;
    case 2:
      return roundScores.roundTwo ? roundScores.roundTwo - par : null;
    case 3:
      return roundScores.roundThree ? roundScores.roundThree - par : null;
    case 4:
      return roundScores.roundFour ? roundScores.roundFour - par : null;
    default:
      return null;
  }
}

/**
 * Calculates holes completed (thru) for live scoring
 */
function calculateThru(
  golfers: Golfer[],
  currentRound: number,
  isLivePlay: boolean = false,
): number | null {
  if (!isLivePlay) {
    return 18; // Non-live play assumes full round
  }

  // For live play, calculate based on current round rules
  if (currentRound <= 2) {
    // Rounds 1-2: Use average of all 10 golfers
    const playingGolfers = golfers.filter(
      (g) => g.round !== null && g.round >= currentRound && g.thru !== null,
    );

    if (playingGolfers.length === 0) return null;

    const totalThru = playingGolfers.reduce(
      (sum, golfer) => sum + (golfer.thru ?? 0),
      0,
    );
    return Math.round(totalThru / playingGolfers.length);
  } else {
    // Rounds 3-4: Use average of active golfers only
    const activeGolfers = golfers.filter((g) => !isGolferCut(g));
    const playingGolfers = activeGolfers.filter(
      (g) => g.round !== null && g.round >= currentRound && g.thru !== null,
    );

    if (playingGolfers.length === 0) return null;

    const totalThru = playingGolfers.reduce(
      (sum, golfer) => sum + (golfer.thru ?? 0),
      0,
    );
    return Math.round(totalThru / playingGolfers.length);
  }
}

/**
 * Updates tee times for all rounds
 */
function updateTeeTimes(team: Team, golfers: Golfer[]): void {
  // Rounds 1-2: Use earliest tee time
  team.roundOneTeeTime =
    getEarliestTeeTime(golfers, "roundOneTeeTime") ?? team.roundOneTeeTime;
  team.roundTwoTeeTime =
    getEarliestTeeTime(golfers, "roundTwoTeeTime") ?? team.roundTwoTeeTime;

  // Rounds 3-4: Use 5th latest tee time (index 4 from the end when sorted latest to earliest)
  team.roundThreeTeeTime =
    getFifthLatestTeeTime(golfers, "roundThreeTeeTime") ??
    team.roundThreeTeeTime;
  team.roundFourTeeTime =
    getFifthLatestTeeTime(golfers, "roundFourTeeTime") ?? team.roundFourTeeTime;
}

/**
 * Gets the earliest tee time from golfers
 */
function getEarliestTeeTime(
  golfers: Golfer[],
  teeTimeKey: keyof Golfer,
): string | null {
  const teeTimeGolfers = golfers
    .filter((g) => g[teeTimeKey] !== null)
    .sort((a, b) => {
      const timeA = new Date(a[teeTimeKey] as string).getTime();
      const timeB = new Date(b[teeTimeKey] as string).getTime();
      return timeA - timeB;
    });

  return (teeTimeGolfers[0]?.[teeTimeKey] as string) ?? null;
}

/**
 * Gets the 5th latest tee time from golfers (for rounds 3-4)
 */
function getFifthLatestTeeTime(
  golfers: Golfer[],
  teeTimeKey: keyof Golfer,
): string | null {
  const teeTimeGolfers = golfers
    .filter((g) => g[teeTimeKey] !== null)
    .sort((a, b) => {
      const timeA = new Date(a[teeTimeKey] as string).getTime();
      const timeB = new Date(b[teeTimeKey] as string).getTime();
      return timeB - timeA; // Sort latest to earliest
    });

  // Get the 5th latest (index 4), or the latest available if less than 5
  const index = Math.min(4, teeTimeGolfers.length - 1);
  return (teeTimeGolfers[index]?.[teeTimeKey] as string) ?? null;
}

/**
 * Updates team positions and calculates points/earnings
 */
async function updateTeamPositionsAndPrizes(
  teams: Team[],
  tournament: TournamentWithCourse,
): Promise<void> {
  const [tier, tourCards] = await Promise.all([
    api.tier.getById({ id: tournament.tierId }),
    api.tourCard.getBySeason({ seasonId: tournament.seasonId }),
  ]);

  // Group teams by tour for position calculation
  const teamsByTour = groupTeamsByTour(teams, tourCards);

  for (const [tourId, tourTeams] of teamsByTour) {
    const updatedTeams = calculatePositions(tourTeams);

    // Calculate points and earnings if tournament is complete
    if (!tournament.livePlay && tournament.currentRound === 5) {
      calculatePointsAndEarnings(updatedTeams, tier);
    }

    // Update each team in the database
    await Promise.all(updatedTeams.map((team) => updateTeamInDatabase(team)));
  }
}

/**
 * Groups teams by their tour ID
 */
function groupTeamsByTour(
  teams: Team[],
  tourCards: TourCard[],
): Map<string, Team[]> {
  const teamsByTour = new Map<string, Team[]>();

  for (const team of teams) {
    const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);
    if (tourCard) {
      const tourId = tourCard.tourId;
      if (!teamsByTour.has(tourId)) {
        teamsByTour.set(tourId, []);
      }
      teamsByTour.get(tourId)!.push(team);
    }
  }

  return teamsByTour;
}

/**
 * Calculates current and past positions for teams
 */
function calculatePositions(teams: Team[]): Team[] {
  // Separate cut teams from active teams
  const cutTeams = teams.filter((team) => team.position === "CUT");
  const activeTeams = teams.filter(
    (team) => team.position !== "CUT" && team.score !== null,
  );

  // Sort active teams by score for current position
  const sortedByScore = [...activeTeams].sort(
    (a, b) => (a.score ?? 999) - (b.score ?? 999),
  );

  // Calculate current positions for active teams
  let currentPosition = 1;
  sortedByScore.forEach((team, index) => {
    if (
      index > 0 &&
      sortedByScore[index - 1] &&
      team.score !== sortedByScore[index - 1]!.score
    ) {
      currentPosition = index + 1;
    }

    const tiedTeams = sortedByScore.filter((t) => t.score === team.score);
    if (tiedTeams.length > 1) {
      team.position = `T${currentPosition}`;
    } else {
      team.position = `${currentPosition}`;
    }
  });

  // Calculate past positions (score - today) for active teams
  const sortedByPastScore = [...activeTeams].sort((a, b) => {
    const pastScoreA = (a.score ?? 999) - (a.today ?? 0);
    const pastScoreB = (b.score ?? 999) - (b.today ?? 0);
    return pastScoreA - pastScoreB;
  });

  let pastPosition = 1;
  sortedByPastScore.forEach((team, index) => {
    const pastScore = (team.score ?? 999) - (team.today ?? 0);

    if (index > 0 && sortedByPastScore[index - 1]) {
      const prevTeam = sortedByPastScore[index - 1]!;
      const prevPastScore = (prevTeam.score ?? 999) - (prevTeam.today ?? 0);
      if (pastScore !== prevPastScore) {
        pastPosition = index + 1;
      }
    }

    const tiedTeams = sortedByPastScore.filter(
      (t) => (t.score ?? 999) - (t.today ?? 0) === pastScore,
    );

    if (tiedTeams.length > 1) {
      team.pastPosition = `T${pastPosition}`;
    } else {
      team.pastPosition = `${pastPosition}`;
    }
  });

  // Cut teams keep their CUT position (already set in calculateTeamScoring)
  // No need to modify them here

  return teams;
}

/**
 * Calculates points and earnings for completed tournaments
 */
function calculatePointsAndEarnings(teams: Team[], tier: Tier | null): void {
  if (!tier) return;

  for (const team of teams) {
    if (team.position === "CUT") {
      team.points = 0;
      team.earnings = 0;
      continue;
    }

    const position = parseInt(team.position?.replace("T", "") ?? "999");

    if (team.position?.includes("T")) {
      // Handle tied positions
      const tiedTeams = teams.filter((t) => t.position === team.position);
      const startIndex = position - 1;
      const endIndex = startIndex + tiedTeams.length;

      const totalPoints = tier.points
        .slice(startIndex, endIndex)
        .reduce((sum, p) => sum + p, 0);
      const totalEarnings = tier.payouts
        .slice(startIndex, endIndex)
        .reduce((sum, p) => sum + p, 0);

      team.points = Math.round(totalPoints / tiedTeams.length);
      team.earnings =
        Math.round((totalEarnings / tiedTeams.length) * 100) / 100;
    } else {
      // No tie
      team.points = tier.points[position - 1] ?? 0;
      team.earnings = tier.payouts[position - 1] ?? 0;
    }
  }
}

/**
 * Updates a team in the database
 */
async function updateTeamInDatabase(team: Team): Promise<void> {
  await api.team.update({
    id: team.id,
    position: team.position || undefined,
    score: team.score ?? undefined,
    today: team.today ?? undefined,
    thru: team.thru ?? undefined,
    points: team.points ?? undefined,
    earnings: team.earnings ?? undefined,
    round: team.round ?? undefined,
    makeCut: team.makeCut ?? undefined,
    topTen: team.topTen ?? undefined,
    topFive: team.topFive ?? undefined,
    topThree: team.topThree ?? undefined,
    win: team.win ?? undefined,
    roundOne: team.roundOne ?? undefined,
    roundTwo: team.roundTwo ?? undefined,
    roundThree: team.roundThree ?? undefined,
    roundFour: team.roundFour ?? undefined,
    roundOneTeeTime: team.roundOneTeeTime || undefined,
    roundTwoTeeTime: team.roundTwoTeeTime || undefined,
    roundThreeTeeTime: team.roundThreeTeeTime || undefined,
    roundFourTeeTime: team.roundFourTeeTime || undefined,
  });
}

/*─────────────────────────────────────────────────────────────*
 *                      UTILITY FUNCTIONS                      *
 *─────────────────────────────────────────────────────────────*/

/**
 * Rounds a number to one decimal place
 */
function roundToOneDecimal(value: number | null | undefined): number | null {
  return value === null || value === undefined
    ? null
    : Math.round(value * 10) / 10;
}
