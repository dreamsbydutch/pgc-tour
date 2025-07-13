/**
 * SIMPLE GOLFER UPDATE SERVICE
 * ============================
 *
 * Streamlined service that:
 * 1. Fetches external data from DataGolf API
 * 2. Creates missing golfers
 * 3. Updates existing golfers with live data
 * 4. Updates tournament status
 */

import { db } from "@/server/db";
import { fetchDataGolf, batchProcess } from "@/lib/utils/main";
import type {
  DataGolfLiveTournament,
  DatagolfFieldInput,
  DatagolfRankingInput,
  DatagolfLiveGolfer,
  DatagolfFieldGolfer,
} from "@/lib/types/datagolf_types";
import type { TournamentWithCourse } from "./types";

export interface UpdateResult {
  golfersUpdated: number;
  golfersCreated: number;
  fieldsUpdated: number;
  liveGolfersCount: number;
  tournamentUpdated: boolean;
}

/**
 * Main function to update all golfers for a tournament
 */
export async function updateAllGolfersOptimized(
  tournament: TournamentWithCourse,
): Promise<UpdateResult> {
  console.log(`🚀 Starting golfer update for tournament: ${tournament.name}`);

  // Step 1: Fetch external data
  const [liveData, fieldData, rankingsData] = await Promise.all([
    fetchDataGolf("preds/in-play", {}) as Promise<DataGolfLiveTournament>,
    fetchDataGolf("field-updates", {}) as Promise<DatagolfFieldInput>,
    fetchDataGolf("preds/get-dg-rankings", {}) as Promise<DatagolfRankingInput>,
  ]);

  console.log(
    `📊 External data fetched: ${fieldData.field.length} field golfers, ${liveData.data.length} live golfers`,
  );

  // Step 2: Get existing golfers and teams
  const [existingGolfers, teams] = await Promise.all([
    db.golfer.findMany({
      where: { tournamentId: tournament.id },
    }),
    db.team.findMany({
      where: { tournamentId: tournament.id },
      select: { id: true, golferIds: true },
    }),
  ]);

  console.log(
    `📊 Found ${existingGolfers.length} existing golfers and ${teams.length} teams`,
  );

  // Step 3: Create missing golfers
  const golfersCreated = await createMissingGolfers(
    fieldData.field,
    existingGolfers,
    rankingsData,
    tournament,
  );

  // Step 4: Update existing golfers
  const { golfersUpdated, fieldsUpdated, liveGolfersCount } =
    await updateExistingGolfers(
      existingGolfers,
      liveData,
      fieldData,
      tournament,
      teams,
    );

  // Step 5: Update tournament status
  const tournamentUpdated = await updateTournamentStatus(
    tournament,
    existingGolfers,
    liveGolfersCount,
  );

  console.log(
    `✅ Update completed: ${golfersUpdated} updated, ${golfersCreated} created, ${fieldsUpdated} fields changed`,
  );

  return {
    golfersUpdated,
    golfersCreated,
    fieldsUpdated,
    liveGolfersCount,
    tournamentUpdated,
  };
}

/**
 * Create missing golfers that exist in field data but not in database
 */
async function createMissingGolfers(
  fieldGolfers: DatagolfFieldGolfer[],
  existingGolfers: Array<{ apiId: number }>,
  rankingsData: DatagolfRankingInput,
  tournament: TournamentWithCourse,
): Promise<number> {
  const existingApiIds = existingGolfers.map((g) => g.apiId);
  const missingGolfers = fieldGolfers.filter(
    (golfer) => !existingApiIds.includes(golfer.dg_id),
  );

  if (missingGolfers.length === 0) {
    console.log("✅ No missing golfers to create");
    return 0;
  }

  console.log(`🔄 Creating ${missingGolfers.length} missing golfers`);

  // Create golfers in batches to avoid timeouts
  let created = 0;
  await batchProcess(
    missingGolfers,
    10,
    async (golfer) => {
      const rankingData = rankingsData.rankings.find(
        (r) => r.dg_id === golfer.dg_id,
      );

      const [lastName, firstName] = golfer.player_name.split(", ");

      await db.golfer.create({
        data: {
          apiId: golfer.dg_id,
          playerName: `${firstName} ${lastName}`,
          group: 0,
          worldRank: rankingData?.owgr_rank ?? 501,
          rating:
            Math.round(
              ((rankingData?.dg_skill_estimate ?? -1.875) + 2) / 0.0004,
            ) / 100,
          tournamentId: tournament.id,
          // Set all other fields to null initially
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
        },
      });
      created++;
    },
    100, // 100ms delay between batches
  );

  console.log(`✅ Created ${created} golfers`);
  return created;
}

/**
 * Update existing golfers with live data
 */
async function updateExistingGolfers(
  golfers: Array<{ id: number; apiId: number; [key: string]: any }>,
  liveData: DataGolfLiveTournament,
  fieldData: DatagolfFieldInput,
  tournament: TournamentWithCourse,
  teams: Array<{ id: number; golferIds: number[] }>,
): Promise<{
  golfersUpdated: number;
  fieldsUpdated: number;
  liveGolfersCount: number;
}> {
  const golferIDs = teams.flatMap((team) => team.golferIds);
  let golfersUpdated = 0;
  let fieldsUpdated = 0;
  let liveGolfersCount = 0;

  console.log(`🔄 Updating ${golfers.length} existing golfers`);

  await batchProcess(
    golfers,
    20,
    async (golfer) => {
      const liveGolfer = liveData.data.find(
        (obj) => obj.dg_id === golfer.apiId,
      );
      const fieldGolfer = fieldData.field.find(
        (obj) => obj.dg_id === golfer.apiId,
      );

      // Build update data
      const updateData = buildUpdateData(
        golfer,
        liveGolfer,
        fieldGolfer,
        tournament,
        golferIDs,
        teams.length,
      );

      // Check if golfer is live
      if (liveGolfer?.thru && liveGolfer.thru > 0 && liveGolfer.thru < 18) {
        liveGolfersCount++;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await db.golfer.update({
          where: { id: golfer.id },
          data: updateData,
        });
        golfersUpdated++;
        fieldsUpdated += Object.keys(updateData).length;
      }
    },
    50, // 50ms delay between batches
  );

  console.log(
    `✅ Updated ${golfersUpdated} golfers with ${fieldsUpdated} field changes`,
  );
  return { golfersUpdated, fieldsUpdated, liveGolfersCount };
}

/**
 * Build update data for a golfer
 */
function buildUpdateData(
  golfer: any,
  liveGolfer: DatagolfLiveGolfer | undefined,
  fieldGolfer: DatagolfFieldGolfer | undefined,
  tournament: TournamentWithCourse,
  golferIDs: number[],
  teamCount: number,
): Record<string, any> {
  const updateData: Record<string, any> = {};

  // Calculate usage (percentage of teams using this golfer)
  const usage =
    golferIDs.filter((id) => id === golfer.apiId).length / teamCount;
  if (usage !== golfer.usage) {
    updateData.usage = usage;
  }

  // Update tee times
  if (
    fieldGolfer?.r1_teetime &&
    fieldGolfer.r1_teetime !== golfer.roundOneTeeTime
  ) {
    updateData.roundOneTeeTime = fieldGolfer.r1_teetime;
  }
  if (
    fieldGolfer?.r2_teetime &&
    fieldGolfer.r2_teetime !== golfer.roundTwoTeeTime
  ) {
    updateData.roundTwoTeeTime = fieldGolfer.r2_teetime;
  }
  if (
    fieldGolfer?.r3_teetime &&
    fieldGolfer.r3_teetime !== golfer.roundThreeTeeTime
  ) {
    updateData.roundThreeTeeTime = fieldGolfer.r3_teetime;
  }
  if (
    fieldGolfer?.r4_teetime &&
    fieldGolfer.r4_teetime !== golfer.roundFourTeeTime
  ) {
    updateData.roundFourTeeTime = fieldGolfer.r4_teetime;
  }

  if (!liveGolfer) return updateData;

  // Update live data
  if (
    liveGolfer.current_pos !== undefined &&
    liveGolfer.current_pos !== golfer.position
  ) {
    updateData.position = liveGolfer.current_pos;
  }

  if (
    liveGolfer.current_score !== undefined &&
    liveGolfer.current_score !== golfer.score
  ) {
    updateData.score = liveGolfer.current_score;
  }

  if (liveGolfer.thru !== undefined && liveGolfer.thru !== golfer.thru) {
    updateData.thru = liveGolfer.thru;
  }

  if (liveGolfer.today !== undefined && liveGolfer.today !== golfer.today) {
    updateData.today = liveGolfer.today;
  }

  // Update round scores
  if (liveGolfer.R1 !== undefined && liveGolfer.R1 !== golfer.roundOne) {
    updateData.roundOne = liveGolfer.R1;
  }
  if (liveGolfer.R2 !== undefined && liveGolfer.R2 !== golfer.roundTwo) {
    updateData.roundTwo = liveGolfer.R2;
  }
  if (liveGolfer.R3 !== undefined && liveGolfer.R3 !== golfer.roundThree) {
    updateData.roundThree = liveGolfer.R3;
  }
  if (liveGolfer.R4 !== undefined && liveGolfer.R4 !== golfer.roundFour) {
    updateData.roundFour = liveGolfer.R4;
  }

  // Update boolean flags
  if (
    liveGolfer.make_cut !== undefined &&
    liveGolfer.make_cut !== golfer.makeCut
  ) {
    updateData.makeCut = liveGolfer.make_cut;
  }
  if (liveGolfer.top_10 !== undefined && liveGolfer.top_10 !== golfer.topTen) {
    updateData.topTen = liveGolfer.top_10;
  }
  if (liveGolfer.win !== undefined && liveGolfer.win !== golfer.win) {
    updateData.win = liveGolfer.win;
  }

  // Update country if not already set
  if (liveGolfer.country && !golfer.country) {
    updateData.country = liveGolfer.country;
  }

  // Update end hole
  if (
    liveGolfer.end_hole !== undefined &&
    liveGolfer.end_hole !== golfer.endHole
  ) {
    updateData.endHole = liveGolfer.end_hole;
  }

  // Determine current round based on completed rounds
  let currentRound = 1;
  if (liveGolfer.R1) currentRound = 2;
  if (liveGolfer.R2) currentRound = 3;
  if (liveGolfer.R3) currentRound = 4;
  if (liveGolfer.R4) currentRound = 5;

  // Handle special cases (CUT, WD, DQ)
  if (liveGolfer.current_pos === "CUT" && liveGolfer.R2) {
    currentRound = 2; // Stay at round 2 if cut
  }

  if (currentRound !== golfer.round) {
    updateData.round = currentRound;
  }

  return updateData;
}

/**
 * Update tournament status
 */
async function updateTournamentStatus(
  tournament: TournamentWithCourse,
  golfers: Array<{ round?: number | null; position?: string | null }>,
  liveGolfersCount: number,
): Promise<boolean> {
  // Determine current round from active golfers
  const activeGolfers = golfers.filter(
    (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
  );

  const currentRound =
    activeGolfers.length > 0
      ? Math.min(...activeGolfers.map((g) => g.round ?? 1))
      : 1;

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
    console.log(
      `✅ Tournament status updated: round ${currentRound}, live: ${livePlay}`,
    );
    return true;
  }

  return false;
}
