/**
 * CREATE GROUPS SERVICE
 * =====================
 *
 * Business logic for creating tournament groups based on golfer rankings.
 *
 * BUSINESS RULES:
 * - Groups golfers by skill level using DataGolf rankings
 * - Group 1: Top 10% (max 10 golfers) - Elite tier
 * - Group 2: Next 17.5% (max 16 golfers) - Strong tier
 * - Group 3: Next 22.5% (max 22 golfers) - Solid tier
 * - Group 4: Next 25% (max 30 golfers) - Competitive tier
 * - Group 5: Remaining golfers - Developmental tier
 * - Excludes specific golfers (e.g., amateur/special cases)
 * - Sorts by DG skill estimate (higher is better)
 */

import { createTRPCContext, createCaller } from "@pgc-server";
import { fetchDataGolf, batchProcess } from "@pgc-utils";
import type { DatagolfFieldInput, DatagolfRankingInput } from "@pgc-types";
import type {
  GroupCreationResult,
  EnhancedGolfer,
  GroupCreationContext,
} from "./types";
import {
  GROUP_LIMITS,
  EXCLUDED_GOLFER_IDS,
  BATCH_SIZE,
  BATCH_DELAY,
} from "./types";
import type { CurrentTournament } from "./types";

/**
 * Main service function to create tournament groups
 */
export async function createTournamentGroups(
  headers: Headers,
): Promise<GroupCreationResult> {
  try {
    // Create TRPC context and caller
    const ctx = await createTRPCContext({ headers });
    const api = createCaller(ctx);

    // Fetch data from DataGolf API
    const context = await fetchTournamentData(api);

    // Validate tournament state
    const validation = validateTournamentState(context);
    if (!validation.shouldProceed) {
      return {
        success: false,
        groupsCreated: 0,
        golfersProcessed: 0,
        message: validation.message,
      };
    }

    // Playoff logic: If current tournament is a playoff and not the first playoff event,
    // copy golfers from the first playoff tournament of the season (overlapping tours).
    if (context.currentTourney && isPlayoffTournament(context.currentTourney)) {
      const eventIndex = await computePlayoffEventIndex(
        api,
        context.currentTourney,
      );
      if (eventIndex > 1) {
        const copyRes = await copyGolfersFromFirstPlayoff(
          api,
          context.currentTourney,
        );
        return {
          success: true,
          groupsCreated: copyRes.groupsCreated,
          golfersProcessed: copyRes.totalProcessed,
          message: `Copied ${copyRes.totalProcessed} golfers from first playoff event into ${context.currentTourney.name}`,
        };
      }
    }

    // Process golfers and create groups
    const groups = await processGolfersIntoGroups(context);

    // Create golfers in database
    const result = await createGolfersInDatabase(
      api,
      groups,
      context.currentTourney!,
    );

    return {
      success: true,
      groupsCreated: groups.filter((group) => group.length > 0).length,
      golfersProcessed: result.totalProcessed,
      message: `Successfully created ${groups.filter((group) => group.length > 0).length} groups with ${result.totalProcessed} golfers`,
    };
  } catch (error) {
    console.error("Error in createTournamentGroups:", error);
    return {
      success: false,
      groupsCreated: 0,
      golfersProcessed: 0,
      message: "Failed to create groups",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch tournament data from APIs
 */
async function fetchTournamentData(
  api: ReturnType<typeof createCaller>,
): Promise<GroupCreationContext> {
  const [rankingsData, fieldData, tournamentInfo] = await Promise.all([
    fetchDataGolf("preds/get-dg-rankings", {}) as Promise<DatagolfRankingInput>,
    fetchDataGolf("field-updates", {}) as Promise<DatagolfFieldInput>,
    api.tournament.getInfo(),
  ]);

  const currentTourney = tournamentInfo.next;
  const existingGolfers = currentTourney
    ? await api.golfer.getByTournament({ tournamentId: currentTourney.id })
    : [];

  return {
    rankingsData,
    fieldData,
    currentTourney,
    existingGolfers,
  };
}

/**
 * Validate if groups should be created
 */
function validateTournamentState(context: GroupCreationContext): {
  shouldProceed: boolean;
  message: string;
} {
  if (!context.currentTourney) {
    return {
      shouldProceed: false,
      message: "No upcoming tournament found",
    };
  }

  if (context.existingGolfers.length > 0) {
    return {
      shouldProceed: false,
      message: "Tournament already has golfers - groups already created",
    };
  }

  return {
    shouldProceed: true,
    message: "Ready to create groups",
  };
}

/**
 * Helpers: playoffs detection and indexing
 */
function isPlayoffTournament(t: CurrentTournament): boolean {
  const name = t.tier?.name?.toLowerCase() ?? "";
  return name.includes("playoff");
}

async function computePlayoffEventIndex(
  api: ReturnType<typeof createCaller>,
  current: CurrentTournament,
): Promise<1 | 2 | 3> {
  const season = await api.tournament.getBySeason({
    seasonId: current.seasonId,
  });
  const events = (season ?? [])
    .filter((t) => (t.tier?.name ?? "").toLowerCase().includes("playoff"))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  if (!events.length) return 1;
  const target = new Date(current.startDate).getTime();
  let idx = events.findIndex((e) => new Date(e.startDate).getTime() === target);
  if (idx === -1) {
    const prior = events.filter(
      (e) => new Date(e.startDate).getTime() < target,
    ).length;
    idx = prior; // 0-based
  }
  const oneBased = idx + 1;
  return oneBased <= 1 ? 1 : oneBased === 2 ? 2 : 3;
}

async function copyGolfersFromFirstPlayoff(
  api: ReturnType<typeof createCaller>,
  current: CurrentTournament,
): Promise<{ totalProcessed: number; groupsCreated: number }> {
  // Find first playoff tournament in season for overlapping tours
  const season = await api.tournament.getBySeason({
    seasonId: current.seasonId,
  });
  const playoffEvents = (season ?? [])
    .filter((t) => (t.tier?.name ?? "").toLowerCase().includes("playoff"))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const first = playoffEvents[0];
  if (!first) {
    // No playoff baseline; nothing to copy
    return { totalProcessed: 0, groupsCreated: 0 };
  }

  // Fetch golfers from the first playoff event
  const baseGolfers = await api.golfer.getByTournament({
    tournamentId: first.id,
  });
  if (!baseGolfers?.length) {
    return { totalProcessed: 0, groupsCreated: 0 };
  }

  // Count distinct non-null groups
  const groupSet = new Set<number>();
  for (const g of baseGolfers) {
    if (typeof g.group === "number") groupSet.add(g.group);
  }

  // Prepare a typed payload to avoid `any` usage
  type BaseGolferForCopy = {
    apiId: number;
    playerName: string;
    group: number | null;
    worldRank: number | null;
    rating: number | null;
    country: string | null;
  };
  const golfersToCopy: BaseGolferForCopy[] = baseGolfers.map((g) => ({
    apiId: g.apiId,
    playerName: g.playerName,
    group: g.group ?? null,
    worldRank: g.worldRank ?? null,
    rating: g.rating ?? null,
    country: g.country ?? null,
  }));

  let totalProcessed = 0;
  await batchProcess(
    golfersToCopy,
    BATCH_SIZE,
    async (g: BaseGolferForCopy) => {
      await api.golfer.create({
        apiId: g.apiId,
        playerName: g.playerName,
        tournamentId: current.id,
        group: g.group ?? undefined,
        worldRank: g.worldRank ?? undefined,
        rating: g.rating ?? undefined,
        country: g.country ?? undefined,
      });
      totalProcessed++;
    },
    BATCH_DELAY,
  );

  return { totalProcessed, groupsCreated: groupSet.size };
}

/**
 * Process golfers into groups based on rankings
 */
async function processGolfersIntoGroups(
  context: GroupCreationContext,
): Promise<EnhancedGolfer[][]> {
  const { rankingsData, fieldData } = context;
  const groups: EnhancedGolfer[][] = [[], [], [], [], []];

  // Filter, enhance, and sort golfers
  const processedGolfers = fieldData.field
    .filter((golfer) => !EXCLUDED_GOLFER_IDS.includes(golfer.dg_id))
    .map(
      (golfer): EnhancedGolfer => ({
        ...golfer,
        ranking_data: rankingsData.rankings.find(
          (obj) => obj.dg_id === golfer.dg_id,
        ),
      }),
    )
    .sort(
      (a, b) =>
        (b.ranking_data?.dg_skill_estimate ?? -50) -
        (a.ranking_data?.dg_skill_estimate ?? -50),
    );

  // Distribute golfers into groups
  processedGolfers.forEach((golfer, index) => {
    const groupIndex = determineGroupIndex(
      golfer,
      index,
      processedGolfers.length,
      groups,
    );
    groups[groupIndex]?.push(golfer);
  });

  return groups;
}

/**
 * Determine which group a golfer should be assigned to
 */
function determineGroupIndex(
  _golfer: EnhancedGolfer,
  currentIndex: number,
  totalGolfers: number,
  groups: EnhancedGolfer[][],
): number {
  const remainingGolfers = totalGolfers - currentIndex;

  // Group 1: Top 10% (max 10)
  if (
    groups[0] &&
    groups[0].length < totalGolfers * GROUP_LIMITS.GROUP_1.percentage &&
    groups[0].length < GROUP_LIMITS.GROUP_1.maxCount
  ) {
    return 0;
  }

  // Group 2: Next 17.5% (max 16)
  if (
    groups[1] &&
    groups[1].length < totalGolfers * GROUP_LIMITS.GROUP_2.percentage &&
    groups[1].length < GROUP_LIMITS.GROUP_2.maxCount
  ) {
    return 1;
  }

  // Group 3: Next 22.5% (max 22)
  if (
    groups[2] &&
    groups[2].length < totalGolfers * GROUP_LIMITS.GROUP_3.percentage &&
    groups[2].length < GROUP_LIMITS.GROUP_3.maxCount
  ) {
    return 2;
  }

  // Group 4: Next 25% (max 30)
  if (
    groups[3] &&
    groups[3].length < totalGolfers * GROUP_LIMITS.GROUP_4.percentage &&
    groups[3].length < GROUP_LIMITS.GROUP_4.maxCount
  ) {
    return 3;
  }

  // Group 5: Remaining golfers - balance between groups 4 and 5
  if (
    (groups[3] &&
      groups[4] &&
      remainingGolfers <= groups[3].length + groups[4].length * 0.5) ||
    remainingGolfers === 1
  ) {
    return 4;
  }

  // Alternate between groups 3 and 4 for remaining golfers
  return currentIndex % 2 ? 3 : 4;
}

/**
 * Create golfers in the database
 */
async function createGolfersInDatabase(
  api: ReturnType<typeof createCaller>,
  groups: EnhancedGolfer[][],
  currentTourney: { id: string; name: string },
): Promise<{ totalProcessed: number }> {
  let totalProcessed = 0;

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex];
    if (!group || group.length === 0) continue;

    await batchProcess(
      group,
      BATCH_SIZE,
      async (golfer) => {
        const name = golfer.player_name.split(", ");

        await api.golfer.create({
          apiId: golfer.dg_id,
          playerName: name[1] + " " + name[0],
          group: groupIndex + 1,
          worldRank: golfer.ranking_data?.owgr_rank ?? 501,
          rating:
            Math.round(
              ((golfer.ranking_data?.dg_skill_estimate ?? -1.875) + 2) / 0.0004,
            ) / 100,
          tournamentId: currentTourney.id,
        });

        totalProcessed++;
      },
      BATCH_DELAY,
    );
  }

  return { totalProcessed };
}
