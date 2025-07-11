/**
 * Services for the golfer update cron job
 * Consolidated business logic with clear separation of concerns
 */

import { api } from "@/trpc/server";
import { fetchDataGolf } from "@/lib/utils/main";
import type { Golfer, Team } from "@prisma/client";
import type {
  DataGolfLiveTournament,
  DatagolfFieldGolfer,
  DatagolfFieldInput,
  DatagolfLiveGolfer,
  DatagolfRankingInput,
} from "@/lib/types/datagolf_types";
import type {
  TournamentWithCourse,
  ExternalAPIData,
  UpdateResult,
} from "./types";

// ================= DATA FETCHING =================

export async function fetchExternalData(): Promise<ExternalAPIData> {
  const [liveData, fieldData, rankingsData] = await Promise.all([
    fetchDataGolf("preds/in-play", {}) as Promise<DataGolfLiveTournament>,
    fetchDataGolf("field-updates", {}) as Promise<DatagolfFieldInput>,
    fetchDataGolf("preds/get-dg-rankings", {}) as Promise<DatagolfRankingInput>,
  ]);

  return { liveData, fieldData, rankingsData };
}

// ================= GOLFER CREATION =================

export async function createMissingGolfers(
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

  await Promise.all(
    missingGolfers.map(async (golfer) => {
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
    }),
  );
}

// ================= GOLFER UPDATES =================

export async function updateAllGolfers(
  golfers: Golfer[],
  liveData: DataGolfLiveTournament,
  fieldData: DatagolfFieldInput,
  tournament: TournamentWithCourse,
  teams: Team[],
): Promise<UpdateResult> {
  const golferIDs = teams.map((team) => team.golferIds).flat();
  let liveGolfersCount = 0;

  await Promise.all(
    golfers.map(async (golfer) => {
      try {
        const liveGolfer = liveData.data.find(
          (obj) =>
            fieldData.event_name === liveData.info.event_name &&
            obj.dg_id === +golfer.apiId,
        );
        const fieldGolfer = fieldData.field.find(
          (obj) => obj.dg_id === +golfer.apiId,
        );

        const updateData = buildGolferUpdateData(
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

        await applyGolferUpdate(golfer.id, updateData);
      } catch (error) {
        console.error(`Error updating golfer ${golfer.playerName}:`, error);
      }
    }),
  );

  return { liveGolfersCount };
}

function buildGolferUpdateData(
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
  setRoundData(updateData, liveGolfer, fieldGolfer, tournament);

  // Set current tournament data
  setCurrentTournamentData(updateData, liveGolfer, golfer, allGolfers);

  return updateData;
}

function setRoundData(
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

function setCurrentTournamentData(
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
    const previousPos = calculatePreviousRoundPosition(golfer, allGolfers);

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
  if (
    liveGolfer.thru !== undefined &&
    !["WD", "DQ", "CUT"].includes(liveGolfer.current_pos)
  ) {
    updateData.thru = liveGolfer.thru;
  }

  if (
    liveGolfer.today !== undefined &&
    !["WD", "DQ", "CUT"].includes(liveGolfer.current_pos)
  ) {
    updateData.today = liveGolfer.today;
  } else if (["WD", "DQ"].includes(liveGolfer.current_pos)) {
    updateData.today = 8; // +8 penalty
    updateData.thru = 18;
  } else if (liveGolfer.current_pos === "CUT") {
    updateData.today = null;
    updateData.thru = null;
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
function calculateScoreUpToRound(golfer: Golfer, round: number): number | null {
  const scores: (number | null)[] = [];

  if (round >= 1) scores.push(golfer.roundOne);
  if (round >= 2) scores.push(golfer.roundTwo);
  if (round >= 3) scores.push(golfer.roundThree);
  if (round >= 4) scores.push(golfer.roundFour);

  // If any required rounds are missing, return null
  const validScores = scores.filter((score) => score !== null) as number[];
  if (validScores.length !== round) {
    return null;
  }

  return validScores.reduce((sum, score) => sum + score, 0);
}

async function applyGolferUpdate(
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
    today: updateData.today ?? undefined,
    thru: updateData.thru ?? undefined,
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

// ================= TOURNAMENT STATUS =================

export async function updateTournamentStatus(
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

function determineTournamentRound(golfers: Golfer[]): number {
  const activeGolfers = golfers.filter(
    (g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""),
  );

  if (activeGolfers.length === 0) return 1;

  // Get the minimum round among active golfers (the round most golfers are still in)
  const minRound = Math.min(...activeGolfers.map((g) => g.round ?? 1));

  return minRound;
}
