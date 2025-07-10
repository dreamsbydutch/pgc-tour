"use server";

import { db } from "@server/db";
import type { Course, Tier, Tournament } from "@prisma/client";
export type TournamentWithRelations = Tournament & {
  course: Course;
  tier: Tier;
};

/**
 * Gets the next upcoming tournament (startDate > now, soonest first)
 */
export async function getNextTournament(): Promise<TournamentWithRelations | null> {
  const t = await db.tournament.findFirst({
    where: { startDate: { gt: new Date() } },
    orderBy: { startDate: "asc" },
    include: { course: true, tier: true },
  });
  return normalizeTournamentDates(t);
}

/**
 * Gets the current tournament (now between startDate and endDate)
 */
export async function getCurrentTournament(): Promise<TournamentWithRelations | null> {
  const now = new Date();
  const t = await db.tournament.findFirst({
    where: {
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
    include: { course: true, tier: true },
  });
  return normalizeTournamentDates(t);
}

/**
 * Gets the most recent previous tournament (endDate < now, latest first)
 */
export async function getPreviousTournament(): Promise<TournamentWithRelations | null> {
  const t = await db.tournament.findFirst({
    where: { endDate: { lt: new Date() } },
    orderBy: { endDate: "desc" },
    include: { course: true, tier: true },
  });
  return normalizeTournamentDates(t);
}

/**
 * Gets all tournaments, ordered by startDate ascending
 */
export async function getAllTournaments(): Promise<TournamentWithRelations[]> {
  const arr = await db.tournament.findMany({
    orderBy: { startDate: "asc" },
    include: { course: true, tier: true },
  });
  return normalizeTournamentArray(arr);
}

/**
 * Gets all tournaments for a given season (by seasonId)
 * @param seasonId - The season ID to filter tournaments
 */
export async function getSeasonTournament(
  seasonId: string,
): Promise<TournamentWithRelations[]> {
  const arr = await db.tournament.findMany({
    where: { seasonId },
    orderBy: { startDate: "asc" },
    include: { course: true, tier: true },
  });
  return normalizeTournamentArray(arr);
}

/**
 * Gets tournament info: { current, next, previous, season }
 * @param seasonId - The season ID to filter tournaments
 * @returns An object with current, next, previous, and season tournaments
 */
export async function getTournamentInfo(seasonId: string) {
  const [current, next, previous, season] = await Promise.all([
    getCurrentTournament(),
    getNextTournament(),
    getPreviousTournament(),
    getSeasonTournament(seasonId),
  ]);
  return { current, next, previous, season };
}

// Helper to ensure startDate and endDate are Date objects
function normalizeTournamentDates<T extends { startDate: string | number | Date; endDate: string | number | Date }>(
  tournament: T | null,
): T | null {
  if (!tournament) return null;
  return {
    ...tournament,
    startDate:
      tournament.startDate instanceof Date
        ? tournament.startDate
        : new Date(tournament.startDate),
    endDate:
      tournament.endDate instanceof Date
        ? tournament.endDate
        : new Date(tournament.endDate),
  };
}

function normalizeTournamentArray<T extends { startDate: string | number | Date; endDate: string | number | Date }>(
  tournaments: T[],
): T[] {
  return tournaments.map((t) => normalizeTournamentDates(t)!);
}
