/**
 * Core DB service helpers used by the update-teams cron.
 *
 * Responsibility
 * - Fetch the current tournament snapshot with related entities
 * - Fetch tour cards for the active season
 * - Batch-update team calculation fields
 * - Playoff helpers: carry-in map and event index
 *
 * Notes
 * - All functions are side-effect free except for batchUpdateTeams which persists updates.
 */
import { db } from "@pgc-server";
import type { TournamentWithRelations, TeamCalculation } from "./types";
import { roundDecimal } from "./utils";

/**
 * Load the currently active tournament (by date range), including relations
 * required by the calculation pipeline.
 *
 * Includes
 * - course, tier, golfers, teams, tours
 *
 * Selection
 * - Picks the latest (most recent startDate) tournament that overlaps "now".
 *
 * @returns A fully-hydrated TournamentWithRelations or null if none is active
 */
export async function loadCurrentTournament(): Promise<TournamentWithRelations | null> {
  const now = new Date();
  const tournament = await db.tournament.findFirst({
    where: { startDate: { lte: now }, endDate: { gte: now } },
    include: {
      course: true,
      tier: true,
      golfers: true,
      teams: true,
      tours: true,
    },
    orderBy: { startDate: "desc" },
  });
  // Prisma typing for include shape differs from our domain type; cast defensively
  return (tournament as unknown as TournamentWithRelations) ?? null;
}

/**
 * Load all tour cards for a given season, including basic relations used by
 * bracket logic and display.
 *
 * @param seasonId Season identifier
 * @returns List of TourCards with member and tour populated
 */
export async function loadTourCardsForSeason(seasonId: string) {
  return db.tourCard.findMany({
    where: { seasonId },
    include: { member: true, tour: true },
  });
}

/**
 * Persist a batch of team calculation updates.
 *
 * Behavior
 * - Iterates sequentially and updates each team by id.
 * - Normalizes numeric fields via roundDecimal and coerces nullables safely.
 * - Returns the total number of updated rows.
 *
 * Considerations
 * - If this needs to scale, consider batching in a transaction or using an
 *   upsert strategy. Current shape is adequate for modest team counts.
 *
 * @param updateData Array of TeamCalculation payloads paired with team id
 * @returns Count of updated teams
 */
export async function batchUpdateTeams(
  updateData: (TeamCalculation & { id: number })[],
) {
  let updated = 0;
  for (const t of updateData) {
    await db.team.update({
      where: { id: t.id },
      data: {
        round: t.round,
        roundOne: roundDecimal(t.roundOne ?? null),
        roundTwo: roundDecimal(t.roundTwo ?? null),
        roundThree: roundDecimal(t.roundThree ?? null),
        roundFour: roundDecimal(t.roundFour ?? null),
        today: roundDecimal(t.today ?? null),
        thru: roundDecimal(t.thru ?? null),
        score: roundDecimal(t.score ?? null),
        position: t.position,
        pastPosition: t.pastPosition,
        roundOneTeeTime: t.roundOneTeeTime ?? null,
        roundTwoTeeTime: t.roundTwoTeeTime ?? null,
        roundThreeTeeTime: t.roundThreeTeeTime ?? null,
        roundFourTeeTime: t.roundFourTeeTime ?? null,
        points: t.points ?? 0,
        earnings: t.earnings ?? 0,
      },
    });
    updated++;
  }
  return updated;
}

// Load carry-in totals for playoffs: for the current tournament, find the most recent
// prior playoff tournament in the same season and overlapping tours, and map each
// tourCardId to its final team score from that event.
/**
 * Build a map of carry-in strokes for playoff events 2/3.
 *
 * Logic
 * - Finds the most recent prior playoff tournament within the same season
 *   that shares at least one tour with the current event.
 * - Maps each tourCardId to its final team score from that previous event.
 *
 * @param seasonId          Season id of the current tournament
 * @param currentStartDate  Start date of the current tournament
 * @param currentTourIds    Tour ids overlapping the current tournament
 * @returns Record mapping tourCardId -> carry-in score (strokes)
 */
export async function loadPlayoffCarryInMap(
  seasonId: string,
  currentStartDate: Date,
  currentTourIds: string[],
): Promise<Record<string, number>> {
  // Find the most recent previous playoff tournament
  const prevPlayoff = await db.tournament.findFirst({
    where: {
      seasonId,
      startDate: { lt: currentStartDate },
      tier: { name: { contains: "playoff", mode: "insensitive" } },
      tours: { some: { id: { in: currentTourIds } } },
    },
    orderBy: { startDate: "desc" },
    include: { teams: true },
  });

  const map: Record<string, number> = {};
  if (!prevPlayoff) return map;
  for (const t of prevPlayoff.teams) {
    if (t.tourCardId) {
      map[t.tourCardId] = t.score ?? 0;
    }
  }
  return map;
}

// Determine the playoff event index (1, 2, or 3) by startDate ordering within the season
// and overlapping tours. Returns 1 if the current tournament is the first in order,
// 2 if second, 3 otherwise.
/**
 * Determine the playoff event index (1, 2, or 3) for the current tournament.
 *
 * Logic
 * - Fetch season playoff events for overlapping tours ordered by startDate (asc)
 * - If current startDate matches exactly, return its 1-based index
 * - Otherwise, count how many events occur prior to the current date to infer index
 *
 * Edge cases
 * - If no playoff events exist, default to 1
 * - If more than 3 events exist, any after the second are treated as index 3
 *
 * @param seasonId          Season id of the current tournament
 * @param currentStartDate  Start date of the current tournament
 * @param currentTourIds    Tour ids overlapping the current tournament
 * @returns 1 | 2 | 3 indicating the playoff event order
 */
export async function loadPlayoffEventIndex(
  seasonId: string,
  currentStartDate: Date,
  currentTourIds: string[],
): Promise<1 | 2 | 3> {
  const events = await db.tournament.findMany({
    where: {
      seasonId,
      tier: { name: { contains: "playoff", mode: "insensitive" } },
      tours: { some: { id: { in: currentTourIds } } },
    },
    orderBy: { startDate: "asc" },
    select: { id: true, startDate: true },
  });
  if (!events.length) return 1;
  const targetTime = currentStartDate.getTime();
  let index = events.findIndex((e) => e.startDate.getTime() === targetTime);
  if (index === -1) {
    const prior = events.filter(
      (e) => e.startDate.getTime() < targetTime,
    ).length;
    index = prior; // 0-based
  }
  const oneBased = index + 1;
  return oneBased <= 1 ? 1 : oneBased === 2 ? 2 : 3;
}
