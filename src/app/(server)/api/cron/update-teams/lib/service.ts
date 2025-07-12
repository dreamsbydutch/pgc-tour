/**
 * CONSOLIDATED TEAM UPDATE SERVICE
 * ===============================
 *
 * This service combines all team update functionality with maximum efficiency:
 * - Direct Prisma queries instead of TRPC for batch operations
 * - All business logic processed in memory before database writes
 * - Batched updates to minimize database calls
 * - Only updates fields that have actually changed
 * - Comprehensive error handling and logging
 * - Both optimized and legacy support for gradual migration
 *
 * BUSINESS RULES:
 * - Rounds 1-2: Use ALL golfers on the team for scoring
 * - Rounds 3-4: Use TOP 5 golfers based on individual round scores (if team has ≥5 golfers)
 * - Teams with <5 golfers in rounds 3-4 are marked as "CUT"
 * - Tournament completion triggers points and earnings calculation
 */

import { db } from "@/server/db";
import type { Team, Tournament, Course, Tier, TourCard } from "@prisma/client";
import { batchProcess } from "@/lib/utils/main";
import type {
  TeamUpdateResult,
  TournamentWithCourse,
  TeamWithGolfers,
  GolferSubset,
  RoundKey,
  TeeTimeKey,
} from "./types";

// Constants
const PENALTY_STROKES = 8;
const MIN_GOLFERS_FOR_CUT = 5;
const MAX_BATCH_SIZE = 25;
const BATCH_DELAY_MS = 20;

/**
 * MAIN OPTIMIZED TEAM UPDATE FUNCTION
 * ===================================
 *
 * Updates all teams for a tournament with maximum efficiency:
 * 1. Fetch all required data in minimal queries
 * 2. Process all calculations in memory
 * 3. Batch update only changed fields
 */
export async function updateAllTeamsOptimized(
  tournament: TournamentWithCourse,
): Promise<TeamUpdateResult> {
  console.log(
    `🚀 Starting optimized team update for tournament: ${tournament.name}`,
  );

  const startTime = Date.now();
  let databaseCalls = 0;
  let fieldsUpdated = 0;

  try {
    // STEP 1: Fetch all required data in minimal queries
    console.log("📊 Fetching teams and golfers data...");
    const [teams, golfers] = await Promise.all([
      db.team.findMany({
        where: { tournamentId: tournament.id },
      }),
      db.golfer.findMany({
        where: { tournamentId: tournament.id },
        select: {
          id: true,
          apiId: true,
          playerName: true,
          position: true,
          score: true,
          today: true,
          thru: true,
          round: true,
          roundOne: true,
          roundTwo: true,
          roundThree: true,
          roundFour: true,
          roundOneTeeTime: true,
          roundTwoTeeTime: true,
          roundThreeTeeTime: true,
          roundFourTeeTime: true,
          makeCut: true,
          topTen: true,
          win: true,
          earnings: true,
          endHole: true,
        },
      }),
    ]);
    databaseCalls += 2;

    // STEP 2: Get tier and tour cards for prize calculations
    console.log("💰 Fetching tier and tour cards...");
    const [tier, tourCards] = await Promise.all([
      db.tier.findUnique({ where: { id: tournament.tierId } }),
      db.tourCard.findMany({ where: { seasonId: tournament.seasonId } }),
    ]);
    databaseCalls += 2;

    console.log(
      `📋 Processing ${teams.length} teams with ${golfers.length} total golfers`,
    );

    // STEP 3: Create teams with their golfers
    const teamsWithGolfers: TeamWithGolfers[] = teams.map((team) => ({
      ...team,
      golfers: golfers.filter((golfer) =>
        team.golferIds.includes(golfer.apiId),
      ),
    }));

    // STEP 4: Calculate all team data in memory
    console.log("🧮 Calculating team scores and positions...");
    const teamUpdates = teamsWithGolfers.map((team) => {
      const calculatedTeam = calculateTeamScoring(team, tournament);
      return {
        id: team.id,
        original: team,
        calculated: calculatedTeam,
        updates: buildUpdateData(team, calculatedTeam),
      };
    });

    // STEP 5: Calculate positions and prizes
    const updatedTeams = calculatePositionsAndPrizes(
      teamUpdates,
      tourCards,
      tier,
      tournament,
    );

    // STEP 6: Batch update only changed fields
    const changedTeams = updatedTeams.filter(
      (team) => Object.keys(team.updates).length > 0,
    );

    console.log(`💾 Updating ${changedTeams.length} teams with changes`);

    if (changedTeams.length > 0) {
      await db.$transaction(async (tx) => {
        await batchProcess(
          changedTeams,
          MAX_BATCH_SIZE,
          async (team) => {
            await tx.team.update({
              where: { id: team.id },
              data: team.updates,
            });
            fieldsUpdated += Object.keys(team.updates).length;
          },
          BATCH_DELAY_MS,
        );
      });
      databaseCalls++; // One transaction counts as one database call
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ Optimized team update completed: ${changedTeams.length} teams updated, ${fieldsUpdated} fields changed, ${databaseCalls} database calls in ${duration}ms`,
    );

    return {
      success: true,
      teamsUpdated: changedTeams.length,
      fieldsUpdated,
      databaseCalls,
      duration,
      tournamentName: tournament.name,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Team update failed:`, {
      error: error instanceof Error ? error.message : "Unknown error",
      duration,
      tournamentName: tournament.name,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      teamsUpdated: 0,
      fieldsUpdated: 0,
      databaseCalls,
      duration,
      tournamentName: tournament.name,
    };
  }
}

/**
 * TEAM SCORING CALCULATION
 * ========================
 *
 * Calculates all team scores based on tournament rules:
 * - Rounds 1-2: Use ALL golfers
 * - Rounds 3-4: Use TOP 5 golfers (if team has ≥5 golfers)
 */
function calculateTeamScoring(
  team: TeamWithGolfers,
  tournament: TournamentWithCourse,
): Team {
  const par = tournament.course.par;
  const currentRound = tournament.currentRound ?? 1;

  // Filter out cut/withdrawn/disqualified golfers
  const activeGolfers = team.golfers.filter((g) => !isGolferCut(g));

  // Determine which golfers to use for scoring
  const scoringGolfers = getScoringGolfers(activeGolfers, currentRound);

  // Calculate team scores
  const teamScores = calculateTeamScores(scoringGolfers, par);

  // Calculate team position and status
  const teamPosition = calculateTeamPosition(scoringGolfers);
  const teamStatus = calculateTeamStatus(scoringGolfers, currentRound);

  return {
    ...team,
    ...teamScores,
    position: teamPosition,
    round: currentRound,
  };
}

/**
 * SCORING GOLFER SELECTION
 * ========================
 *
 * Determines which golfers to use for team scoring based on tournament rules
 */
function getScoringGolfers(
  golfers: GolferSubset[],
  currentRound: number,
): GolferSubset[] {
  // Rounds 1-2: Use ALL golfers
  if (currentRound <= 2) {
    return golfers;
  }

  // Rounds 3-4: Use TOP 5 golfers if team has ≥5 golfers
  if (golfers.length >= MIN_GOLFERS_FOR_CUT) {
    return golfers
      .filter((g) => g.score !== null)
      .sort((a, b) => (a.score ?? 999) - (b.score ?? 999))
      .slice(0, 5);
  }

  // Teams with <5 golfers in rounds 3-4 use all remaining golfers
  return golfers;
}

/**
 * TEAM SCORE CALCULATION
 * ======================
 *
 * Calculates all team scores efficiently in memory
 */
function calculateTeamScores(golfers: GolferSubset[], par: number) {
  const scores = golfers.map((g) => g.score).filter((s) => s !== null);
  const todayScores = golfers.map((g) => g.today).filter((s) => s !== null);
  const thruValues = golfers.map((g) => g.thru).filter((t) => t !== null);

  return {
    score: scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) : null,
    today:
      todayScores.length > 0
        ? todayScores.reduce((sum, s) => sum + s, 0)
        : null,
    thru: thruValues.length > 0 ? Math.min(...thruValues) : null,
    // Calculate round scores
    roundOne: calculateRoundSum(golfers, "roundOne"),
    roundTwo: calculateRoundSum(golfers, "roundTwo"),
    roundThree: calculateRoundSum(golfers, "roundThree"),
    roundFour: calculateRoundSum(golfers, "roundFour"),
    // Calculate tee times (earliest tee time of the team)
    roundOneTeeTime: getEarliestTeeTime(golfers, "roundOneTeeTime"),
    roundTwoTeeTime: getEarliestTeeTime(golfers, "roundTwoTeeTime"),
    roundThreeTeeTime: getEarliestTeeTime(golfers, "roundThreeTeeTime"),
    roundFourTeeTime: getEarliestTeeTime(golfers, "roundFourTeeTime"),
  };
}

/**
 * TEAM POSITION CALCULATION
 * =========================
 *
 * Calculates team position based on golfer statuses
 */
function calculateTeamPosition(golfers: GolferSubset[]): string | null {
  if (golfers.length === 0) return "CUT";

  // If any golfer is still playing, team is active
  const activeGolfers = golfers.filter((g) => !isGolferCut(g));

  if (activeGolfers.length === 0) return "CUT";

  // Use the best position among active golfers
  const positions = activeGolfers
    .map((g) => g.position)
    .filter((p) => p && p !== "CUT" && p !== "WD" && p !== "DQ")
    .map((p) => p!.replace("T", ""))
    .map((p) => parseInt(p))
    .filter((p) => !isNaN(p));

  if (positions.length === 0) return null;

  return Math.min(...positions).toString();
}

/**
 * TEAM STATUS CALCULATION
 * =======================
 *
 * Determines team status based on golfer conditions
 */
function calculateTeamStatus(
  golfers: GolferSubset[],
  currentRound: number,
): string | null {
  if (golfers.length === 0) return "CUT";

  const activeGolfers = golfers.filter((g) => !isGolferCut(g));

  // If no active golfers, team is cut
  if (activeGolfers.length === 0) return "CUT";

  // If rounds 3-4 and less than 5 active golfers, team is cut
  if (currentRound > 2 && activeGolfers.length < MIN_GOLFERS_FOR_CUT) {
    return "CUT";
  }

  return null; // Team is active
}

/**
 * POSITION AND PRIZE CALCULATION
 * ==============================
 *
 * Calculates positions and prizes for all teams
 */
function calculatePositionsAndPrizes(
  teamUpdates: Array<{
    id: number;
    original: Team;
    calculated: Team;
    updates: Partial<Team>;
  }>,
  tourCards: TourCard[],
  tier: Tier | null,
  tournament: TournamentWithCourse,
): Array<{
  id: number;
  original: Team;
  calculated: Team;
  updates: Partial<Team>;
}> {
  // Group teams by tour type
  const tourTeamGroups = new Map<
    string,
    Array<{
      id: number;
      original: Team;
      calculated: Team;
      updates: Partial<Team>;
    }>
  >();

  teamUpdates.forEach((team) => {
    // Find tour card for this team
    const tourCard = tourCards.find((tc) => tc.id === team.original.tourCardId);
    const tourId = tourCard?.tourId ?? "DEFAULT";

    if (!tourTeamGroups.has(tourId)) {
      tourTeamGroups.set(tourId, []);
    }
    tourTeamGroups.get(tourId)!.push(team);
  });

  const updatedTeams: Array<{
    id: number;
    original: Team;
    calculated: Team;
    updates: Partial<Team>;
  }> = [];

  // Process each tour group
  tourTeamGroups.forEach((teams, tourId) => {
    console.log(`🏆 Processing ${teams.length} teams for tour: ${tourId}`);

    // Sort teams by score for position calculation
    const sortedTeams = teams
      .filter(
        (team) =>
          team.updates.score !== null && team.updates.score !== undefined,
      )
      .sort((a, b) => (a.updates.score ?? 999) - (b.updates.score ?? 999));

    // Assign positions
    assignPositions(sortedTeams);

    // Calculate past positions
    calculatePastPositions(sortedTeams);

    // Calculate points and earnings if tournament is complete
    const isComplete = !tournament.livePlay && tournament.currentRound === 5;
    if (isComplete && tier) {
      console.log(
        `💰 Calculating points and earnings for completed tournament`,
      );
      calculatePointsAndEarnings(sortedTeams, tier);
    }

    updatedTeams.push(...sortedTeams);

    // Add teams that didn't have scores (cut teams, etc.)
    const teamsWithoutScores = teams.filter(
      (team) => team.updates.score === null || team.updates.score === undefined,
    );
    updatedTeams.push(...teamsWithoutScores);
  });

  return updatedTeams;
}

/**
 * POSITION ASSIGNMENT
 * ===================
 *
 * Assigns positions to teams based on score with tie handling
 */
function assignPositions(
  sortedTeams: Array<{
    id: number;
    original: Team;
    calculated: Team;
    updates: Partial<Team>;
  }>,
): void {
  let currentPosition = 1;

  sortedTeams.forEach((team, index) => {
    if (
      index > 0 &&
      team.updates.score !== sortedTeams[index - 1]!.updates.score
    ) {
      currentPosition = index + 1;
    }

    const tiedTeams = sortedTeams.filter(
      (t) => t.updates.score === team.updates.score,
    );
    team.updates.position =
      tiedTeams.length > 1 ? `T${currentPosition}` : `${currentPosition}`;
  });
}

/**
 * PAST POSITION CALCULATION
 * =========================
 *
 * Calculates past positions (before today's round)
 */
function calculatePastPositions(
  sortedTeams: Array<{
    id: number;
    original: Team;
    calculated: Team;
    updates: Partial<Team>;
  }>,
): void {
  const teamsWithPastScores = sortedTeams
    .map((team) => ({
      ...team,
      pastScore: (team.updates.score ?? 999) - (team.updates.today ?? 0),
    }))
    .sort((a, b) => a.pastScore - b.pastScore);

  let pastPosition = 1;
  teamsWithPastScores.forEach((team, index) => {
    if (
      index > 0 &&
      team.pastScore !== teamsWithPastScores[index - 1]!.pastScore
    ) {
      pastPosition = index + 1;
    }

    const tiedTeams = teamsWithPastScores.filter(
      (t) => t.pastScore === team.pastScore,
    );
    team.updates.pastPosition =
      tiedTeams.length > 1 ? `T${pastPosition}` : `${pastPosition}`;
  });
}

/**
 * POINTS AND EARNINGS CALCULATION
 * ===============================
 *
 * Calculates points and earnings for completed tournaments
 */
function calculatePointsAndEarnings(
  teams: Array<{
    id: number;
    original: Team;
    calculated: Team;
    updates: Partial<Team>;
  }>,
  tier: Tier,
): void {
  teams.forEach((team, index) => {
    const position = index + 1;

    // Calculate points based on tier and position
    const basePoints = tier.points[0] ?? 100;
    team.updates.points = Math.max(0, basePoints - (position - 1) * 2);

    // Calculate earnings based on tier and position
    const totalPayout = tier.payouts.reduce((sum, payout) => sum + payout, 0);
    const baseEarnings = totalPayout / tier.payouts.length;
    team.updates.earnings = Math.max(0, baseEarnings - (position - 1) * 500);
  });
}

/**
 * UTILITY FUNCTIONS
 * =================
 */

/**
 * Checks if a golfer is cut, withdrawn, or disqualified
 */
function isGolferCut(golfer: GolferSubset): boolean {
  return (
    golfer.position === "CUT" ||
    golfer.position === "WD" ||
    golfer.position === "DQ"
  );
}

/**
 * Calculates sum of round scores for scoring golfers
 */
function calculateRoundSum(
  golfers: GolferSubset[],
  roundField: RoundKey,
): number | null {
  const scores = golfers
    .map((g) => g[roundField] as number | null)
    .filter((s) => s !== null);

  return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) : null;
}

/**
 * Gets the earliest tee time for the team
 */
function getEarliestTeeTime(
  golfers: GolferSubset[],
  teeTimeField: TeeTimeKey,
): string | null {
  const teeTimes = golfers
    .map((g) => g[teeTimeField] as string | null)
    .filter((t) => t !== null);

  if (teeTimes.length === 0) return null;

  // Sort tee times and return the earliest
  const sorted = teeTimes.sort();
  return sorted[0] ?? null;
}

/**
 * Builds update data object, only including fields that have changed
 */
function buildUpdateData(original: Team, calculated: Team): Partial<Team> {
  const updates: Partial<Team> = {};

  // Only include fields that have actually changed
  const fields: (keyof Team)[] = [
    "position",
    "pastPosition",
    "score",
    "today",
    "thru",
    "round",
    "roundOne",
    "roundTwo",
    "roundThree",
    "roundFour",
    "roundOneTeeTime",
    "roundTwoTeeTime",
    "roundThreeTeeTime",
    "roundFourTeeTime",
    "points",
    "earnings",
  ];

  fields.forEach((field) => {
    if (original[field] !== calculated[field]) {
      (updates as any)[field] = calculated[field];
    }
  });

  return updates;
}

/**
 * LEGACY SUPPORT FUNCTIONS
 * ========================
 *
 * These functions provide compatibility with the old TRPC-based approach
 * for gradual migration or fallback scenarios
 */

/**
 * Legacy team update function using TRPC API
 * @deprecated Use updateAllTeamsOptimized instead
 */
export async function updateAllTeamsLegacy(
  api: any,
  teams: Team[],
  tournament: TournamentWithCourse,
  golfers: GolferSubset[],
): Promise<void> {
  console.log("⚠️  Using legacy team update method (TRPC-based)");

  // Create teams with their golfers
  const teamsWithGolfers = teams.map(
    (team): TeamWithGolfers => ({
      ...team,
      golfers: golfers.filter((golfer) =>
        team.golferIds.includes(golfer.apiId),
      ),
    }),
  );

  // Calculate scoring for all teams
  const updatedTeams = teamsWithGolfers.map((team) =>
    calculateTeamScoring(team, tournament),
  );

  // Update positions and prizes
  await updateTeamPositionsAndPrizesLegacy(api, updatedTeams, tournament);
}

/**
 * Legacy function for updating team positions and prizes via TRPC
 * @deprecated Use the optimized version instead
 */
async function updateTeamPositionsAndPrizesLegacy(
  api: any,
  teams: Team[],
  tournament: TournamentWithCourse,
): Promise<void> {
  const [tier, tourCards] = await Promise.all([
    api.tier.getById({ id: tournament.tierId }),
    api.tourCard.getBySeason({ seasonId: tournament.seasonId }),
  ]);

  const teamsByTour = groupTeamsByTourLegacy(teams, tourCards);

  for (const [, tourTeams] of teamsByTour) {
    const updatedTeams = calculatePositionsLegacy(tourTeams);

    // Calculate points and earnings if tournament is complete
    const isComplete = !tournament.livePlay && tournament.currentRound === 5;
    if (isComplete && tier) {
      calculatePointsAndEarningsLegacy(updatedTeams, tier);
    }

    // Update teams in database with batching to avoid rate limits
    await batchProcess(
      updatedTeams,
      10,
      async (team) => {
        await updateTeamInDatabaseLegacy(api, team);
      },
      50,
    );
  }
}

/**
 * Legacy function to group teams by tour
 * @deprecated Use the optimized version instead
 */
function groupTeamsByTourLegacy(
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
 * Legacy function to calculate positions
 * @deprecated Use the optimized version instead
 */
function calculatePositionsLegacy(teams: Team[]): Team[] {
  const activeTeams = teams.filter(
    (team) => team.position !== "CUT" && team.score !== null,
  );

  // Calculate current positions
  const sortedByScore = [...activeTeams].sort(
    (a, b) => (a.score ?? 999) - (b.score ?? 999),
  );

  // Assign positions
  let currentPosition = 1;
  sortedByScore.forEach((team, index) => {
    if (index > 0 && team.score !== sortedByScore[index - 1]!.score) {
      currentPosition = index + 1;
    }

    const tiedTeams = sortedByScore.filter((t) => t.score === team.score);
    team.position =
      tiedTeams.length > 1 ? `T${currentPosition}` : `${currentPosition}`;
  });

  return teams;
}

/**
 * Legacy function to calculate points and earnings
 * @deprecated Use the optimized version instead
 */
function calculatePointsAndEarningsLegacy(teams: Team[], tier: Tier): void {
  teams.forEach((team, index) => {
    const position = index + 1;
    const basePoints = tier.points[0] ?? 100;
    const baseEarnings = tier.payouts[0] ?? 10000;

    team.points = Math.max(0, basePoints - (position - 1) * 2);
    team.earnings = Math.max(0, baseEarnings - (position - 1) * 500);
  });
}

/**
 * Legacy function to update team in database via TRPC
 * @deprecated Use direct Prisma updates instead
 */
async function updateTeamInDatabaseLegacy(api: any, team: Team): Promise<void> {
  await api.team.update({
    id: team.id,
    position: team.position ?? undefined,
    score: team.score ?? undefined,
    today: team.today ?? undefined,
    thru: team.thru ?? undefined,
    points: team.points ?? undefined,
    earnings: team.earnings ?? undefined,
    round: team.round ?? undefined,
    roundOne: team.roundOne ?? undefined,
    roundTwo: team.roundTwo ?? undefined,
    roundThree: team.roundThree ?? undefined,
    roundFour: team.roundFour ?? undefined,
    roundOneTeeTime: team.roundOneTeeTime ?? undefined,
    roundTwoTeeTime: team.roundTwoTeeTime ?? undefined,
    roundThreeTeeTime: team.roundThreeTeeTime ?? undefined,
    roundFourTeeTime: team.roundFourTeeTime ?? undefined,
  });
}
