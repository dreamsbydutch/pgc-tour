"use server";

import { db } from "@server/db";

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
    createdAt: string;
    updatedAt: string;
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
    createdAt: string;
    updatedAt: string;
  };
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CurrentScheduleResult = {
  tournaments: ScheduleTournament[];
  season: {
    number: number;
    id: string;
    year: number;
    createdAt: string;
    updatedAt: string;
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
  const tournamentsWithDetails = tournaments
    .filter((t) => !!t.tier && !!t.course)
    .map((t) => {
      return {
        ...t,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        tier: {
          ...t.tier,
          createdAt: t.tier.createdAt.toISOString(),
          updatedAt: t.tier.updatedAt.toISOString(),
        },
        course: {
          ...t.course,
          createdAt: t.course.createdAt.toISOString(),
          updatedAt: t.course.updatedAt.toISOString(),
        },
      };
    });

  return {
    tournaments: tournamentsWithDetails,
    season: {
      number: season.number,
      id: season.id,
      year: season.year,
      createdAt: season.createdAt.toISOString(),
      updatedAt: season.updatedAt.toISOString(),
    },
  };
}
