"use server";

import { db } from "@pgc-server";

export type ScheduleTournament = {
  name: string;
  id: string;
  seasonId: string;
  apiId: string | null;
  tierId: string;
  courseId: string;
  logoUrl: string | null;
  currentRound: number | null;
  livePlay: boolean | null;
  tier: {
    name: string;
    id: string;
    payouts: number[];
    points: number[];
    seasonId: string;
  };
  course: {
    name: string;
    id: string;
    apiId: string;
    location: string;
    par: number;
    front: number;
    back: number;
    timeZoneOffset: number;
  };
  startDate: Date;
  endDate: Date;
};

export type CurrentScheduleResult = {
  tournaments: ScheduleTournament[];
  season: {
    number: number;
    id: string;
    year: number;
  } | null;
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
    (t) => !!t.tier && !!t.course,
  );

  return {
    tournaments: tournamentsWithDetails,
    season: {
      number: season.number,
      id: season.id,
      year: season.year,
    },
  };
}
