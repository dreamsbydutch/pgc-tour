import { db } from "@pgc-server";
import type { TournamentWithRelations, TeamCalculation } from "./types";
import { roundDecimal } from "./utils";

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
  return (tournament as unknown as TournamentWithRelations) ?? null;
}

export async function loadTourCardsForSeason(seasonId: string) {
  return db.tourCard.findMany({
    where: { seasonId },
    include: { member: true, tour: true },
  });
}

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
