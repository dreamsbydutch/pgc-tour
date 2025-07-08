"use server";

import { db } from "../db";
import type { Tournament, Tier, Course, Season } from "@prisma/client";

export type ScheduleTournament = Tournament & { tier: Tier; course: Course };

export type CurrentScheduleResult = {
  tournaments: ScheduleTournament[];
  season: Season | null;
};

/**
 * Returns all tournaments from the current season, with tier and course attached to each tournament.
 */
export async function getCurrentSchedule(): Promise<CurrentScheduleResult> {
  // Get the current season
  const season = await db.season.findFirst({
    orderBy: { year: "desc" },
  });
  if (!season) return { tournaments: [], season: null };

  // Get all tournaments for the current season, including tier and course
  const tournaments = await db.tournament.findMany({
    where: { seasonId: season.id },
    include: { tier: true, course: true },
    orderBy: { startDate: "asc" },
  });

  // Only include tournaments with a tier and course
  const tournamentsWithDetails = tournaments.filter(
    (t): t is ScheduleTournament => !!t.tier && !!t.course,
  );

  return {
    tournaments: tournamentsWithDetails,
    season,
  };
}
