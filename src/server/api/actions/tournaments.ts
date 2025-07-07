/**
 * Tournament Server Actions
 * Server-side equivalent of useTournament hook
 *
 * Provides tournament navigation and data retrieval for server-side rendering
 * and server components. Returns the same data structure as the client hook.
 */

import { db } from "@/server/db";
import { tournaments } from "@/lib/utils/domain/tournaments";
import type { TournamentHookResult, MinimalTournament } from "@/lib/types";
import type { Tournament } from "@prisma/client";

/**
 * Get all tournament navigation data
 * Server equivalent of useTournament()
 */
export async function getTournamentData(
  seasonId?: string,
): Promise<TournamentHookResult> {
  try {
    // Fetch tournaments from database with all required fields
    const allTournaments = await db.tournament.findMany({
      where: seasonId ? { seasonId } : {},
      include: {
        season: true,
        course: true,
        tier: true,
      },
      orderBy: { startDate: "asc" },
    });

    // Convert to minimal tournament format
    const tournamentList: MinimalTournament[] = allTournaments.map((t) => ({
      id: t.id,
      name: t.name,
      logoUrl: t.logoUrl,
      startDate: t.startDate,
      endDate: t.endDate,
      livePlay: t.livePlay,
      currentRound: t.currentRound,
      season: {
        id: t.season.id,
        year: t.season.year,
      },
      course: {
        id: t.course.id,
        name: t.course.name,
        location: t.course.location,
        par: t.course.par,
        front: t.course.front,
        back: t.course.back,
        apiId: t.course.apiId,
      },
      tier: {
        id: t.tier.id,
        name: t.tier.name,
        payouts: t.tier.payouts,
        points: t.tier.points,
        seasonId: t.tier.seasonId,
      },
    }));

    // Use tournament utils for filtering (same logic as hooks)
    const current = tournaments.getCurrentTournament(allTournaments);
    const next = tournaments.getNextTournament(allTournaments);
    const upcoming = tournaments.getUpcoming(allTournaments);
    const completed = tournaments.getCompleted(allTournaments);
    const previous = completed[0] || null;

    // Convert filtered results to MinimalTournament format
    const convertToMinimal = (
      t: Omit<
        Tournament,
        "apiId" | "createdAt" | "updatedAt" | "seasonId" | "tierId" | "courseId"
      > | null,
    ): MinimalTournament | null => {
      if (!t) return null;
      const fullTournament = allTournaments.find((ft) => ft.id === t.id);
      if (!fullTournament) return null;

      return {
        id: fullTournament.id,
        name: fullTournament.name,
        logoUrl: fullTournament.logoUrl,
        startDate: fullTournament.startDate,
        endDate: fullTournament.endDate,
        livePlay: fullTournament.livePlay,
        currentRound: fullTournament.currentRound,
        season: {
          id: fullTournament.season.id,
          year: fullTournament.season.year,
        },
        course: {
          id: fullTournament.course.id,
          name: fullTournament.course.name,
          location: fullTournament.course.location,
          par: fullTournament.course.par,
          front: fullTournament.course.front,
          back: fullTournament.course.back,
          apiId: fullTournament.course.apiId,
        },
        tier: {
          id: fullTournament.tier.id,
          name: fullTournament.tier.name,
          points: fullTournament.tier.points,
          payouts: fullTournament.tier.payouts,
          seasonId: fullTournament.tier.seasonId,
        },
      };
    };

    const convertArrayToMinimal = (
      arr: Omit<
        Tournament,
        "apiId" | "createdAt" | "updatedAt" | "seasonId" | "tierId" | "courseId"
      >[],
    ): MinimalTournament[] => {
      return arr
        .map((t) => convertToMinimal(t))
        .filter(Boolean) as MinimalTournament[];
    };

    // Get season data
    const season = allTournaments[0]?.season || null;

    return {
      current: convertToMinimal(current),
      next: convertToMinimal(next),
      previous: convertToMinimal(previous),
      upcoming: convertArrayToMinimal(upcoming),
      completed: convertArrayToMinimal(completed),
      all: tournamentList,
      currentSeason: tournamentList.filter(
        (a) => a.season.year === new Date().getFullYear(),
      ),
      season,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching tournament data:", error);
    return {
      current: null,
      next: null,
      previous: null,
      upcoming: [],
      completed: [],
      all: [],
      currentSeason: [],
      season: null,
      isLoading: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get tournament history for a specific season
 * Server equivalent of useTournamentHistory()
 */
export async function getTournamentHistory(
  seasonId?: string,
): Promise<MinimalTournament[]> {
  try {
    const tournaments = await db.tournament.findMany({
      where: seasonId ? { seasonId } : {},
      include: {
        course: true,
        tier: true,
      },
      orderBy: { startDate: "desc" },
    });

    return tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      logoUrl: t.logoUrl,
      startDate: t.startDate,
      endDate: t.endDate,
      livePlay: t.livePlay,
      currentRound: t.currentRound,
      seasonId: t.seasonId,
      courseId: t.courseId,
      tierId: t.tierId,
      course: {
        id: t.course.id,
        name: t.course.name,
        location: t.course.location,
        par: t.course.par,
        apiId: t.course.apiId,
      },
      tier: {
        id: t.tier.id,
        name: t.tier.name,
        seasonId: t.tier.seasonId,
      },
    }));
  } catch (error) {
    console.error("Error fetching tournament history:", error);
    return [];
  }
}

/**
 * Get current tournament
 * Convenience function for server components
 */
export async function getCurrentTournament(): Promise<MinimalTournament | null> {
  const data = await getTournamentData();
  return data.current;
}

/**
 * Get next tournament
 * Convenience function for server components
 */
export async function getNextTournament(): Promise<MinimalTournament | null> {
  const data = await getTournamentData();
  return data.next;
}
