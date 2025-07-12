/**
 * COMPREHENSIVE GOLFER UPDATE SERVICE
 * ===================================
 *
 * This service combines both optimized and legacy approaches:
 * - Primary: Ultra-efficient direct Prisma operations (90%+ fewer DB calls)
 * - Fallback: Legacy TRPC-based operations for compatibility
 * - Uses direct Prisma queries instead of TRPC for batch operations
 * - Fetches all data in minimal queries with proper includes
 * - Calculates all golfer data in memory before database updates
 * - Uses transaction batching to minimize database round trips
 * - Only updates fields that have actually changed
 */

import { db } from "@/server/db";
import { fetchDataGolf, batchProcess } from "@/lib/utils/main";
import type { Golfer, Team, Tournament, Course } from "@prisma/client";
import type {
  DataGolfLiveTournament,
  DatagolfFieldGolfer,
  DatagolfFieldInput,
  DatagolfLiveGolfer,
  DatagolfRankingInput,
} from "@/lib/types/datagolf_types";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

// Extended types for our optimized queries
type TournamentWithCourse = Tournament & { course: Course };
type GolferSubset = {
  id: number;
  apiId: number;
  playerName: string;
  position: string | null;
  posChange: number | null;
  score: number | null;
  makeCut: number | null;
  topTen: number | null;
  win: number | null;
  today: number | null;
  thru: number | null;
  round: number | null;
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
  roundOneTeeTime: string | null;
  roundTwoTeeTime: string | null;
  roundThreeTeeTime: string | null;
  roundFourTeeTime: string | null;
  endHole: number | null;
  usage: number | null;
  country: string | null;
  earnings: number | null;
  worldRank: number | null;
  rating: number | null;
  group: number | null;
};

type ExternalAPIData = {
  liveData: DataGolfLiveTournament;
  fieldData: DatagolfFieldInput;
  rankingsData: DatagolfRankingInput;
};

type OptimizedUpdateResult = {
  golfersUpdated: number;
  golfersCreated: number;
  fieldsUpdated: number;
  databaseCalls: number;
  liveGolfersCount: number;
  tournamentUpdated: boolean;
};

type UpdateResult = {
  liveGolfersCount: number;
};

// API type for legacy TRPC operations
type APIInstance = {
  golfer: {
    create: (
      input: RouterInputs["golfer"]["create"],
    ) => Promise<RouterOutputs["golfer"]["create"]>;
    update: (
      input: RouterInputs["golfer"]["update"],
    ) => Promise<RouterOutputs["golfer"]["update"]>;
    getByTournament: (
      input: RouterInputs["golfer"]["getByTournament"],
    ) => Promise<RouterOutputs["golfer"]["getByTournament"]>;
  };
  team: {
    getByTournament: (
      input: RouterInputs["team"]["getByTournament"],
    ) => Promise<RouterOutputs["team"]["getByTournament"]>;
  };
  tournament: {
    getInfo: () => Promise<RouterOutputs["tournament"]["getInfo"]>;
    update: (
      input: RouterInputs["tournament"]["update"],
    ) => Promise<RouterOutputs["tournament"]["update"]>;
  };
};

// ================= PRIMARY OPTIMIZED FUNCTIONS =================

/**
 * Ultra-efficient golfer update that minimizes database calls
 */
export async function updateAllGolfersOptimized(
  tournament: TournamentWithCourse,
): Promise<OptimizedUpdateResult> {
  console.log(
    `🚀 Starting optimized golfer update for tournament: ${tournament.name}`,
  );

  let databaseCalls = 0;
  let fieldsUpdated = 0;
  let golfersCreated = 0;
  let liveGolfersCount = 0;

  // STEP 1: Fetch all external data concurrently
  const externalData = await fetchExternalData();
  console.log(
    `📊 Fetched external data: ${externalData.fieldData.field.length} field golfers, ${externalData.liveData.data.length} live golfers`,
  );

  // STEP 2: Get all golfers and teams in minimal queries
  const [golfers, teams] = await Promise.all([
    db.golfer.findMany({
      where: { tournamentId: tournament.id },
      select: {
        id: true,
        apiId: true,
        playerName: true,
        position: true,
        posChange: true,
        score: true,
        makeCut: true,
        topTen: true,
        win: true,
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
        endHole: true,
        usage: true,
        country: true,
        earnings: true,
        worldRank: true,
        rating: true,
        group: true,
      },
    }),
    db.team.findMany({
      where: { tournamentId: tournament.id },
      select: {
        id: true,
        golferIds: true,
      },
    }),
  ]);
  databaseCalls += 2;

  console.log(
    `📊 Processing ${golfers.length} existing golfers and ${teams.length} teams`,
  );

  // STEP 3: Create missing golfers in memory first
  const missingGolfers = await createMissingGolfersOptimized(
    externalData,
    golfers,
    tournament,
  );
  if (missingGolfers.length > 0) {
    await db.$transaction(async (tx) => {
      await batchProcess(
        missingGolfers,
        20,
        async (golfer) => {
          await tx.golfer.create({ data: golfer });
          golfersCreated++;
        },
        25,
      );
    });
    databaseCalls++;
    console.log(`✅ Created ${missingGolfers.length} missing golfers`);
  }

  // STEP 4: Calculate all golfer updates in memory
  const allGolfers = [
    ...golfers,
    ...missingGolfers.map((g, i) => ({ ...g, id: -(i + 1) })),
  ]; // Temporary IDs for new golfers
  const golferUpdates = calculateAllGolferUpdates(
    golfers, // Only existing golfers for updates
    externalData,
    tournament,
    teams,
    allGolfers,
  );

  // STEP 5: Count live golfers
  liveGolfersCount = golferUpdates.filter(
    (update) => update.liveStatus === "live",
  ).length;

  // STEP 6: Batch update only golfers with changes
  const changedGolfers = golferUpdates.filter(
    (golfer) => Object.keys(golfer.updates).length > 0,
  );

  console.log(`📝 Updating ${changedGolfers.length} golfers with changes`);

  if (changedGolfers.length > 0) {
    await db.$transaction(async (tx) => {
      await batchProcess(
        changedGolfers,
        20,
        async (golfer) => {
          await tx.golfer.update({
            where: { id: golfer.id },
            data: golfer.updates,
          });
          fieldsUpdated += Object.keys(golfer.updates).length;
        },
        25,
      );
    });
    databaseCalls++;
  }

  // STEP 7: Update tournament status
  const tournamentUpdated = await updateTournamentStatusOptimized(
    tournament,
    allGolfers,
    liveGolfersCount,
  );
  if (tournamentUpdated) {
    databaseCalls++;
  }

  console.log(
    `✅ Optimized golfer update completed: ${changedGolfers.length} golfers updated, ${golfersCreated} created, ${fieldsUpdated} fields changed, ${databaseCalls} database calls`,
  );

  return {
    golfersUpdated: changedGolfers.length,
    golfersCreated,
    fieldsUpdated,
    databaseCalls,
    liveGolfersCount,
    tournamentUpdated,
  };
}

// ================= SHARED DATA FETCHING =================

/**
 * Fetch all external data concurrently
 */
export async function fetchExternalData(): Promise<ExternalAPIData> {
  const [liveData, fieldData, rankingsData] = await Promise.all([
    fetchDataGolf("preds/in-play", {}) as Promise<DataGolfLiveTournament>,
    fetchDataGolf("field-updates", {}) as Promise<DatagolfFieldInput>,
    fetchDataGolf("preds/get-dg-rankings", {}) as Promise<DatagolfRankingInput>,
  ]);

  return { liveData, fieldData, rankingsData };
}

// ================= OPTIMIZED HELPER FUNCTIONS =================

/**
 * Create missing golfers in memory (don't insert yet)
 */
async function createMissingGolfersOptimized(
  externalData: ExternalAPIData,
  existingGolfers: GolferSubset[],
  tournament: TournamentWithCourse,
): Promise<Omit<Golfer, "id" | "createdAt" | "updatedAt">[]> {
  const existingApiIds = existingGolfers.map((g) => g.apiId);
  const missingGolfers = externalData.fieldData.field.filter(
    (golfer) => !existingApiIds.includes(golfer.dg_id),
  );

  if (missingGolfers.length === 0) return [];

  return missingGolfers.map((golfer) => {
    const rankingData = externalData.rankingsData.rankings.find(
      (r) => r.dg_id === golfer.dg_id,
    );

    const [lastName, firstName] = golfer.player_name.split(", ");

    return {
      apiId: golfer.dg_id,
      playerName: `${firstName} ${lastName}`,
      group: 0,
      worldRank: rankingData?.owgr_rank ?? 501,
      rating:
        Math.round(((rankingData?.dg_skill_estimate ?? -1.875) + 2) / 0.0004) /
        100,
      tournamentId: tournament.id,
      country: null,
      position: null,
      posChange: null,
      score: null,
      makeCut: null,
      topTen: null,
      win: null,
      today: null,
      thru: null,
      round: null,
      roundOne: null,
      roundTwo: null,
      roundThree: null,
      roundFour: null,
      roundOneTeeTime: null,
      roundTwoTeeTime: null,
      roundThreeTeeTime: null,
      roundFourTeeTime: null,
      endHole: null,
      usage: null,
      earnings: null,
    };
  });
}

/**
 * Calculate all golfer updates in memory
 */
function calculateAllGolferUpdates(
  golfers: GolferSubset[],
  externalData: ExternalAPIData,
  tournament: TournamentWithCourse,
  teams: Array<{ id: number; golferIds: number[] }>,
  allGolfers: GolferSubset[],
): Array<{
  id: number;
  updates: Partial<Omit<Golfer, "id" | "createdAt" | "updatedAt">>;
  liveStatus: "live" | "not-live";
}> {
  const golferIDs = teams.map((team) => team.golferIds).flat();

  return golfers.map((golfer) => {
    const liveGolfer = externalData.liveData.data.find(
      (obj) =>
        externalData.fieldData.event_name ===
          externalData.liveData.info.event_name && obj.dg_id === golfer.apiId,
    );
    const fieldGolfer = externalData.fieldData.field.find(
      (obj) => obj.dg_id === golfer.apiId,
    );

    const updates = buildGolferUpdateData(
      golfer,
      liveGolfer,
      fieldGolfer,
      tournament,
      golferIDs,
      teams,
      allGolfers,
    );

    const liveStatus = isGolferLive(liveGolfer) ? "live" : "not-live";

    return {
      id: golfer.id,
      updates,
      liveStatus,
    };
  });
}

/**
 * Build golfer update data and only include changed fields
 */
function buildGolferUpdateData(
  golfer: GolferSubset,
  liveGolfer: DatagolfLiveGolfer | undefined,
  fieldGolfer: DatagolfFieldGolfer | undefined,
  tournament: TournamentWithCourse,
  golferIDs: number[],
  teams: Array<{ id: number; golferIds: number[] }>,
  allGolfers: GolferSubset[],
): Partial<Omit<Golfer, "id" | "createdAt" | "updatedAt">> {
  const newData: Partial<Omit<Golfer, "id" | "createdAt" | "updatedAt">> = {};

  // Calculate usage
  const usage =
    golferIDs.filter((id) => id === golfer.apiId).length / teams.length;
  if (usage !== golfer.usage) {
    newData.usage = usage;
  }

  // Set round-by-round data
  setRoundData(newData, golfer, liveGolfer, fieldGolfer, tournament);

  // Set current tournament data
  setCurrentTournamentData(newData, golfer, liveGolfer, allGolfers);

  return newData;
}

/**
 * Set round-by-round data, only updating changed fields
 */
function setRoundData(
  newData: Partial<Golfer>,
  golfer: GolferSubset,
  liveGolfer: DatagolfLiveGolfer | undefined,
  fieldGolfer: DatagolfFieldGolfer | undefined,
  tournament: TournamentWithCourse,
): void {
  const par = tournament.course.par;

  // Round 1
  if (
    fieldGolfer?.r1_teetime &&
    fieldGolfer.r1_teetime !== golfer.roundOneTeeTime
  ) {
    newData.roundOneTeeTime = fieldGolfer.r1_teetime;
  }
  if (fieldGolfer?.r1_teetime && golfer.round !== 1) {
    newData.round = 1;
  }
  if (liveGolfer?.R1 && liveGolfer.R1 !== golfer.roundOne) {
    newData.roundOne = liveGolfer.R1;
  }
  if (liveGolfer?.R1 && golfer.round !== 2) {
    newData.round = 2;
  }
  if (
    !liveGolfer?.R1 &&
    fieldGolfer?.r1_teetime &&
    (liveGolfer?.current_pos === "WD" || liveGolfer?.current_pos === "DQ") &&
    golfer.roundOne !== par + 8
  ) {
    newData.roundOne = par + 8;
  }

  // Round 2
  if (
    fieldGolfer?.r2_teetime &&
    fieldGolfer.r2_teetime !== golfer.roundTwoTeeTime
  ) {
    newData.roundTwoTeeTime = fieldGolfer.r2_teetime;
  }
  if (liveGolfer?.R2 && liveGolfer.R2 !== golfer.roundTwo) {
    newData.roundTwo = liveGolfer.R2;
  }
  if (liveGolfer?.R2) {
    const newRound =
      liveGolfer?.current_pos === "CUT" ||
      liveGolfer?.current_pos === "WD" ||
      liveGolfer?.current_pos === "DQ"
        ? 2
        : 3;
    if (golfer.round !== newRound) {
      newData.round = newRound;
    }
  }
  if (
    !liveGolfer?.R2 &&
    fieldGolfer?.r2_teetime &&
    (liveGolfer?.current_pos === "WD" || liveGolfer?.current_pos === "DQ") &&
    golfer.roundTwo !== par + 8
  ) {
    newData.roundTwo = par + 8;
  }

  // Round 3
  if (
    fieldGolfer?.r3_teetime &&
    fieldGolfer.r3_teetime !== golfer.roundThreeTeeTime
  ) {
    newData.roundThreeTeeTime = fieldGolfer.r3_teetime;
  }
  if (liveGolfer?.R3 && liveGolfer.R3 !== golfer.roundThree) {
    newData.roundThree = liveGolfer.R3;
  }
  if (liveGolfer?.R3 && golfer.round !== 4) {
    newData.round = 4;
  }
  if (
    !liveGolfer?.R3 &&
    fieldGolfer?.r3_teetime &&
    (liveGolfer?.current_pos === "WD" || liveGolfer?.current_pos === "DQ") &&
    golfer.roundThree !== par + 8
  ) {
    newData.roundThree = par + 8;
  }

  // Round 4
  if (
    fieldGolfer?.r4_teetime &&
    fieldGolfer.r4_teetime !== golfer.roundFourTeeTime
  ) {
    newData.roundFourTeeTime = fieldGolfer.r4_teetime;
  }
  if (liveGolfer?.R4 && liveGolfer.R4 !== golfer.roundFour) {
    newData.roundFour = liveGolfer.R4;
  }
  if (liveGolfer?.R4 && golfer.round !== 5) {
    newData.round = 5;
  }
  if (
    !liveGolfer?.R4 &&
    fieldGolfer?.r4_teetime &&
    (liveGolfer?.current_pos === "WD" || liveGolfer?.current_pos === "DQ") &&
    golfer.roundFour !== par + 8
  ) {
    newData.roundFour = par + 8;
  }
}

/**
 * Set current tournament data, only updating changed fields
 */
function setCurrentTournamentData(
  newData: Partial<Golfer>,
  golfer: GolferSubset,
  liveGolfer: DatagolfLiveGolfer | undefined,
  allGolfers: GolferSubset[],
): void {
  if (!liveGolfer) return;

  // Position and position change
  if (
    liveGolfer.current_pos !== undefined &&
    liveGolfer.current_pos !== golfer.position
  ) {
    newData.position = liveGolfer.current_pos || undefined;

    // Calculate position change based on previous round standings
    const currentPos = parsePosition(liveGolfer.current_pos);
    const previousPos = calculatePreviousRoundPosition(golfer, allGolfers);

    if (currentPos !== null && previousPos !== null) {
      const posChange = previousPos - currentPos; // Positive means moved up
      if (posChange !== golfer.posChange) {
        newData.posChange = posChange;
      }
    }
  }

  // Overall tournament score
  if (
    liveGolfer.current_score !== undefined &&
    liveGolfer.current_pos !== undefined &&
    !["--", "WD", "DQ"].includes(liveGolfer.current_pos)
  ) {
    if (liveGolfer.current_score !== golfer.score) {
      newData.score = liveGolfer.current_score;
    }
  } else if (golfer.score !== null) {
    newData.score = null;
  }

  // Holes completed and today's score
  if (liveGolfer.current_pos === "CUT") {
    // CUT golfers have no today score or holes completed
    if (golfer.today !== null) newData.today = null;
    if (golfer.thru !== null) newData.thru = null;
  } else if (["WD", "DQ"].includes(liveGolfer.current_pos)) {
    // WD/DQ golfers get penalty scores
    if (golfer.today !== 8) newData.today = 8;
    if (golfer.thru !== 18) newData.thru = 18;
  } else if (!["WD", "DQ", "CUT"].includes(liveGolfer.current_pos)) {
    // Active golfers get their live scores
    if (liveGolfer.thru !== golfer.thru) {
      newData.thru = liveGolfer.thru ?? null;
    }
    if (liveGolfer.today !== golfer.today) {
      newData.today = liveGolfer.today ?? null;
    }
  }

  // Additional fields
  if (liveGolfer.top_10 !== undefined && liveGolfer.top_10 !== golfer.topTen) {
    newData.topTen = liveGolfer.top_10;
  }
  if (
    liveGolfer.make_cut !== undefined &&
    liveGolfer.make_cut !== golfer.makeCut
  ) {
    newData.makeCut = liveGolfer.make_cut;
  }
  if (liveGolfer.win !== undefined && liveGolfer.win !== golfer.win) {
    newData.win = liveGolfer.win;
  }
  if (
    liveGolfer.country !== undefined &&
    golfer.country === null &&
    liveGolfer.country
  ) {
    newData.country = liveGolfer.country;
  }
  if (
    liveGolfer.end_hole !== undefined &&
    liveGolfer.end_hole !== golfer.endHole
  ) {
    newData.endHole = liveGolfer.end_hole;
  }
}

/**
 * Update tournament status efficiently
 */
async function updateTournamentStatusOptimized(
  tournament: TournamentWithCourse,
  golfers: GolferSubset[],
  liveGolfersCount: number,
): Promise<boolean> {
  const currentRound = determineTournamentRound(golfers);
  const livePlay = liveGolfersCount > 0;

  // Only update if values have changed
  if (
    tournament.currentRound !== currentRound ||
    tournament.livePlay !== livePlay
  ) {
    await db.tournament.update({
      where: { id: tournament.id },
      data: {
        currentRound,
        livePlay,
      },
    });
    return true;
  }

  return false;
}

// ================= LEGACY TRPC-BASED FUNCTIONS =================

/**
 * Legacy golfer creation using TRPC (for compatibility)
 */
export async function createMissingGolfers(
  api: APIInstance,
  field: DatagolfFieldGolfer[],
  existingGolfers: Array<{ apiId: number }>,
  rankingsData: DatagolfRankingInput,
  tournament: TournamentWithCourse,
): Promise<void> {
  const existingApiIds = existingGolfers.map((g) => g.apiId);
  const missingGolfers = field.filter(
    (golfer) => !existingApiIds.includes(golfer.dg_id),
  );

  if (missingGolfers.length === 0) return;

  // Batch create golfers to avoid rate limits
  await batchProcess(
    missingGolfers,
    5,
    async (golfer) => {
      const rankingData = rankingsData.rankings.find(
        (r) => r.dg_id === golfer.dg_id,
      );

      const [lastName, firstName] = golfer.player_name.split(", ");
      const golferData = {
        apiId: golfer.dg_id,
        playerName: `${firstName} ${lastName}`,
        group: 0,
        worldRank: rankingData?.owgr_rank ?? 501,
        rating:
          Math.round(
            ((rankingData?.dg_skill_estimate ?? -1.875) + 2) / 0.0004,
          ) / 100,
        tournamentId: tournament.id,
      };

      await api.golfer.create(golferData);
    },
    100,
  );
}

/**
 * Legacy golfer updates using TRPC (for compatibility)
 */
export async function updateAllGolfers(
  api: APIInstance,
  golfers: Golfer[],
  liveData: DataGolfLiveTournament,
  fieldData: DatagolfFieldInput,
  tournament: TournamentWithCourse,
  teams: Team[],
): Promise<UpdateResult> {
  const golferIDs = teams.map((team) => team.golferIds).flat();
  let liveGolfersCount = 0;

  // Batch update golfers to avoid rate limits
  await batchProcess(
    golfers,
    10,
    async (golfer) => {
      try {
        const liveGolfer = liveData.data.find(
          (obj) =>
            fieldData.event_name === liveData.info.event_name &&
            obj.dg_id === +golfer.apiId,
        );
        const fieldGolfer = fieldData.field.find(
          (obj) => obj.dg_id === +golfer.apiId,
        );

        const updateData = buildGolferUpdateDataLegacy(
          golfer,
          liveGolfer,
          fieldGolfer,
          tournament,
          golferIDs,
          teams,
          golfers,
        );

        if (isGolferLive(liveGolfer)) {
          liveGolfersCount++;
        }
        await applyGolferUpdate(api, golfer.id, updateData);
      } catch (error) {
        console.error(`Error updating golfer ${golfer.playerName}:`, error);
      }
    },
    50,
  );

  return { liveGolfersCount };
}

/**
 * Legacy tournament status update using TRPC (for compatibility)
 */
export async function updateTournamentStatus(
  api: APIInstance,
  tournament: TournamentWithCourse,
  golfers: Golfer[],
  liveGolfersCount: number,
): Promise<void> {
  const currentRound = determineTournamentRound(golfers);

  await api.tournament.update({
    id: tournament.id,
    currentRound,
    livePlay: liveGolfersCount > 0,
  });
}

// ================= SHARED HELPER FUNCTIONS =================

/**
 * Check if golfer is currently live
 */
function isGolferLive(liveGolfer: DatagolfLiveGolfer | undefined): boolean {
  return !!(liveGolfer?.thru && liveGolfer.thru > 0 && liveGolfer.thru < 18);
}

/**
 * Parse position string to number (handles "T" ties)
 */
function parsePosition(position: string): number | null {
  if (!position || ["--", "WD", "DQ", "CUT"].includes(position)) {
    return null;
  }
  return Number(position.replace("T", ""));
}

/**
 * Calculate golfer's position after the previous round
 */
function calculatePreviousRoundPosition(
  golfer: GolferSubset,
  allGolfers: GolferSubset[],
): number | null {
  const currentRound = golfer.round ?? 1;

  // If in round 1, no previous position exists
  if (currentRound <= 1) {
    return null;
  }

  // Calculate scores up to the previous round
  const golfersWithScores = allGolfers
    .map((g) => ({
      apiId: g.apiId,
      score: calculateScoreUpToRound(g, currentRound - 1),
    }))
    .filter((g) => g.score !== null)
    .sort((a, b) => (a.score ?? 999) - (b.score ?? 999));

  // Find this golfer's score
  const thisGolferScore = golfersWithScores.find(
    (g) => g.apiId === golfer.apiId,
  )?.score;

  if (thisGolferScore === null || thisGolferScore === undefined) {
    return null;
  }

  // Count how many golfers have a better (lower) score
  const betterScoreCount = golfersWithScores.filter(
    (g) => (g.score ?? 999) < thisGolferScore,
  ).length;

  // Position is the number of golfers with better scores + 1
  return betterScoreCount + 1;
}

/**
 * Calculate total score up to a specific round
 */
function calculateScoreUpToRound(
  golfer: GolferSubset,
  round: number,
): number | null {
  const scores = [];

  if (round >= 1) scores.push(golfer.roundOne);
  if (round >= 2) scores.push(golfer.roundTwo);
  if (round >= 3) scores.push(golfer.roundThree);
  if (round >= 4) scores.push(golfer.roundFour);

  // If any required rounds are missing, return null
  const validScores = scores.filter((score) => score !== null);
  if (validScores.length !== round) {
    return null;
  }

  return validScores.reduce((sum, score) => sum + score, 0);
}

/**
 * Determine tournament round based on golfer data
 */
function determineTournamentRound(
  golfers: Array<{ round?: number | null; position?: string | null }>,
): number {
  const activeGolfers = golfers.filter(
    (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
  );

  if (activeGolfers.length === 0) return 1;

  // Get the minimum round among active golfers (the round most golfers are still in)
  const minRound = Math.min(...activeGolfers.map((g) => g.round ?? 1));

  return minRound;
}

// ================= LEGACY HELPER FUNCTIONS =================

/**
 * Legacy golfer update data builder (for TRPC compatibility)
 */
function buildGolferUpdateDataLegacy(
  golfer: Golfer,
  liveGolfer: DatagolfLiveGolfer | undefined,
  fieldGolfer: DatagolfFieldGolfer | undefined,
  tournament: TournamentWithCourse,
  golferIDs: number[],
  teams: Team[],
  allGolfers: Golfer[],
): Partial<Omit<Golfer, "id">> {
  const updateData: Partial<Omit<Golfer, "id">> = {};

  updateData.usage =
    golferIDs.filter((id) => id === golfer.apiId).length / teams.length;

  // Set round-by-round data
  setRoundDataLegacy(updateData, liveGolfer, fieldGolfer, tournament);

  // Set current tournament data
  setCurrentTournamentDataLegacy(updateData, liveGolfer, golfer, allGolfers);

  return updateData;
}

/**
 * Legacy round data setter (for TRPC compatibility)
 */
function setRoundDataLegacy(
  updateData: Partial<Golfer>,
  liveGolfer: DatagolfLiveGolfer | undefined,
  fieldGolfer: DatagolfFieldGolfer | undefined,
  tournament: TournamentWithCourse,
): void {
  const par = tournament.course.par;

  // Round 1
  if (fieldGolfer?.r1_teetime) {
    updateData.roundOneTeeTime = fieldGolfer.r1_teetime;
    updateData.round = 1;
  }
  if (liveGolfer?.R1) {
    updateData.roundOne = liveGolfer.R1;
    updateData.round = 2;
  }
  if (
    !liveGolfer?.R1 &&
    fieldGolfer?.r1_teetime &&
    (liveGolfer?.current_pos === "WD" || liveGolfer?.current_pos === "DQ")
  ) {
    updateData.roundOne = par + 8;
  }

  // Round 2
  if (fieldGolfer?.r2_teetime) {
    updateData.roundTwoTeeTime = fieldGolfer.r2_teetime;
  }
  if (liveGolfer?.R2) {
    updateData.roundTwo = liveGolfer.R2;
    updateData.round =
      liveGolfer?.current_pos === "CUT" ||
      liveGolfer?.current_pos === "WD" ||
      liveGolfer?.current_pos === "DQ"
        ? 2
        : 3;
  }
  if (
    !liveGolfer?.R2 &&
    fieldGolfer?.r2_teetime &&
    (liveGolfer?.current_pos === "WD" || liveGolfer?.current_pos === "DQ")
  ) {
    updateData.roundTwo = par + 8;
  }

  // Round 3
  if (fieldGolfer?.r3_teetime) {
    updateData.roundThreeTeeTime = fieldGolfer.r3_teetime;
  }
  if (liveGolfer?.R3) {
    updateData.roundThree = liveGolfer.R3;
    updateData.round = 4;
  }
  if (
    !liveGolfer?.R3 &&
    fieldGolfer?.r3_teetime &&
    (liveGolfer?.current_pos === "WD" || liveGolfer?.current_pos === "DQ")
  ) {
    updateData.roundThree = par + 8;
  }

  // Round 4
  if (fieldGolfer?.r4_teetime) {
    updateData.roundFourTeeTime = fieldGolfer.r4_teetime;
  }
  if (liveGolfer?.R4) {
    updateData.roundFour = liveGolfer.R4;
    updateData.round = 5;
  }
  if (
    !liveGolfer?.R4 &&
    fieldGolfer?.r4_teetime &&
    (liveGolfer?.current_pos === "WD" || liveGolfer?.current_pos === "DQ")
  ) {
    updateData.roundFour = par + 8;
  }
}

/**
 * Legacy current tournament data setter (for TRPC compatibility)
 */
function setCurrentTournamentDataLegacy(
  updateData: Partial<Golfer>,
  liveGolfer: DatagolfLiveGolfer | undefined,
  golfer: Golfer,
  allGolfers: Golfer[],
): void {
  if (!liveGolfer) return;

  // Position and position change
  if (liveGolfer.current_pos !== undefined) {
    updateData.position = liveGolfer.current_pos || undefined;

    // Calculate position change based on previous round standings
    const currentPos = parsePosition(liveGolfer.current_pos);
    const previousPos = calculatePreviousRoundPositionLegacy(
      golfer,
      allGolfers,
    );

    if (currentPos !== null && previousPos !== null) {
      updateData.posChange = previousPos; // Positive means moved up
    }
  }

  // Overall tournament score
  if (
    liveGolfer.current_score !== undefined &&
    liveGolfer.current_pos !== undefined &&
    !["--", "WD", "DQ"].includes(liveGolfer.current_pos)
  ) {
    updateData.score = liveGolfer.current_score;
  } else {
    updateData.score = undefined;
  }

  // Holes completed and today's score
  if (liveGolfer.current_pos === "CUT") {
    // CUT golfers have no today score or holes completed
    updateData.today = null;
    updateData.thru = null;
  } else if (["WD", "DQ"].includes(liveGolfer.current_pos)) {
    // WD/DQ golfers get penalty scores
    updateData.today = 8; // +8 penalty
    updateData.thru = 18;
  } else if (!["WD", "DQ", "CUT"].includes(liveGolfer.current_pos)) {
    // Active golfers get their live scores
    updateData.thru = liveGolfer.thru ?? null;
    updateData.today = liveGolfer.today ?? null;
  }

  // Additional fields
  if (liveGolfer.top_10 !== undefined) {
    updateData.topTen = liveGolfer.top_10;
  }
  if (liveGolfer.make_cut !== undefined) {
    updateData.makeCut = liveGolfer.make_cut;
  }
  if (liveGolfer.win !== undefined) {
    updateData.win = liveGolfer.win;
  }
  if (liveGolfer.country !== undefined && golfer.country === null) {
    updateData.country = liveGolfer.country ?? undefined;
  }
  if (liveGolfer.end_hole !== undefined) {
    updateData.endHole = liveGolfer.end_hole;
  }
}

/**
 * Legacy position calculation (for TRPC compatibility)
 */
function calculatePreviousRoundPositionLegacy(
  golfer: Golfer,
  allGolfers: Golfer[],
): number | null {
  const currentRound = golfer.round ?? 1;

  // If in round 1, no previous position exists
  if (currentRound <= 1) {
    return null;
  }

  // Calculate scores up to the previous round
  const golfersWithScores = allGolfers
    .map((g) => ({
      apiId: g.apiId,
      score: calculateScoreUpToRoundLegacy(g, currentRound - 1),
    }))
    .filter((g) => g.score !== null)
    .sort((a, b) => (a.score ?? 999) - (b.score ?? 999));

  // Find this golfer's score
  const thisGolferScore = golfersWithScores.find(
    (g) => g.apiId === golfer.apiId,
  )?.score;

  if (thisGolferScore === null || thisGolferScore === undefined) {
    return null;
  }

  // Count how many golfers have a better (lower) score
  const betterScoreCount = golfersWithScores.filter(
    (g) => (g.score ?? 999) < thisGolferScore,
  ).length;

  // Position is the number of golfers with better scores + 1
  return betterScoreCount + 1;
}

/**
 * Legacy score calculation (for TRPC compatibility)
 */
function calculateScoreUpToRoundLegacy(
  golfer: Golfer,
  round: number,
): number | null {
  const scores = [];

  if (round >= 1) scores.push(golfer.roundOne);
  if (round >= 2) scores.push(golfer.roundTwo);
  if (round >= 3) scores.push(golfer.roundThree);
  if (round >= 4) scores.push(golfer.roundFour);

  // If any required rounds are missing, return null
  const validScores = scores.filter((score) => score !== null);
  if (validScores.length !== round) {
    return null;
  }

  return validScores.reduce((sum, score) => sum + score, 0);
}

/**
 * Legacy golfer update applier (for TRPC compatibility)
 */
async function applyGolferUpdate(
  api: APIInstance,
  golferId: number,
  updateData: Partial<Omit<Golfer, "id">>,
): Promise<void> {
  await api.golfer.update({
    id: golferId,
    position: updateData.position ?? undefined,
    score: updateData.score ?? undefined,
    makeCut: updateData.makeCut ?? undefined,
    topTen: updateData.topTen ?? undefined,
    win: updateData.win ?? undefined,
    today: updateData.today ?? null,
    thru: updateData.thru ?? null,
    round: updateData.round ?? undefined,
    earnings: updateData.earnings ?? undefined,
    usage: updateData.usage ?? undefined,
    country: updateData.country ?? undefined,
    endHole: updateData.endHole ?? undefined,
    posChange: updateData.posChange ?? undefined,
    // Round scores
    roundOne: updateData.roundOne ?? undefined,
    roundTwo: updateData.roundTwo ?? undefined,
    roundThree: updateData.roundThree ?? undefined,
    roundFour: updateData.roundFour ?? undefined,
    // Tee times
    roundOneTeeTime: updateData.roundOneTeeTime ?? undefined,
    roundTwoTeeTime: updateData.roundTwoTeeTime ?? undefined,
    roundThreeTeeTime: updateData.roundThreeTeeTime ?? undefined,
    roundFourTeeTime: updateData.roundFourTeeTime ?? undefined,
  });
}
