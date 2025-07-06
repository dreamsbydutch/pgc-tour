/**
 * Champions Server Actions
 * Server-side equivalent of useChampions hook
 * 
 * Provides recent champions data for server-side rendering
 * and     if (!tournamentData) {
      return {
        tournament: undefined,
        champs: [],
        error: "Tournament not found",
        isLoading: false,
      };
    }omponents. Returns the same data structure as the client hook.
 */

import { db } from "@/src/server/db";
import { tournaments } from "@/src/lib/utils/domain/tournaments";
import { validation } from "@/src/lib/utils";
import type { ChampionsResult, MinimalTournament } from "@/src/lib/types";

/**
 * Get recent champions data
 * Server equivalent of useRecentChampions()
 */
export async function getRecentChampions(
  daysLimit: number = 7,
): Promise<ChampionsResult> {
  try {
    // Get most recent completed tournament with relations
    const completedTournaments = await db.tournament.findMany({
      where: {
        endDate: {
          lt: new Date(), // Tournament has ended
        },
      },
      include: {
        course: true,
        tier: true,
      },
      orderBy: { endDate: "desc" },
      take: 1,
    });

    const recentTournament = completedTournaments[0];

    if (!recentTournament) {
      return {
        tournament: undefined,
        champs: [],
        error: "No recent tournaments",
        isLoading: false,
      };
    }

    // Convert to MinimalTournament format
    const minimalTournament: MinimalTournament = {
      id: recentTournament.id,
      name: recentTournament.name,
      logoUrl: recentTournament.logoUrl,
      startDate: recentTournament.startDate,
      endDate: recentTournament.endDate,
      livePlay: recentTournament.livePlay,
      currentRound: recentTournament.currentRound,
      seasonId: recentTournament.seasonId,
      courseId: recentTournament.courseId,
      tierId: recentTournament.tierId,
      course: {
        id: recentTournament.course.id,
        name: recentTournament.course.name,
        location: recentTournament.course.location,
        par: recentTournament.course.par,
        apiId: recentTournament.course.apiId,
      },
      tier: {
        id: recentTournament.tier.id,
        name: recentTournament.tier.name,
        seasonId: recentTournament.tier.seasonId,
      },
    };

    // Validate timing
    const isWithinTimeLimit = validation.validateTournamentWindow(
      minimalTournament,
      daysLimit,
    ).isValid;

    if (!isWithinTimeLimit) {
      return {
        tournament: minimalTournament,
        champs: [],
        error: "Tournament too old",
        isLoading: false,
      };
    }

    // Get champions (teams with position 1)
    const championTeams = await db.team.findMany({
      where: {
        tournamentId: recentTournament.id,
        position: "1", // Assuming position is stored as string "1" for winners
      },
      include: {
        tournament: true,
      },
      orderBy: [
        { earnings: "desc" }, // Order by earnings in case of ties
      ],
    });

    // Fetch related data for enrichment
    const [tours, tourCards] = await Promise.all([
      db.tour.findMany(),
      db.tourCard.findMany({
        include: {
          tour: true,
          member: true,
        },
      }),
    ]);

    // Enrich champions with tour information
    const enrichedChampions = championTeams.map((team) => {
      const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);
      const tour = tourCard
        ? tours.find((t) => t.id === tourCard.tourId)
        : null;

      return {
        ...team,
        tour: tour || { id: "unknown", name: "Unknown" },
        tourCard: tourCard || null,
      };
    });

    return {
      tournament: minimalTournament,
      champs: enrichedChampions as any,
      error: null,
      isLoading: false,
    };
  } catch (error) {
    console.error("Error fetching recent champions:", error);
    return {
      tournament: undefined,
      champs: [],
      error: error instanceof Error ? error.message : "Unknown error",
      isLoading: false,
    };
  }
}

/**
 * Get champions for a specific tournament
 * Convenience function for server components
 */
export async function getChampionsByTournament(
  tournamentId: string,
): Promise<ChampionsResult> {
  try {
    // Fetch specific tournament
    const tournamentData = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        course: true,
        tier: true,
      },
    });

    if (!tournamentData) {
      return {
        tournament: null,
        champions: [],
        error: "Tournament not found",
        isLoading: false,
      };
    }

    const tournament: MinimalTournament = {
      id: tournamentData.id,
      name: tournamentData.name,
      logoUrl: tournamentData.logoUrl,
      startDate: tournamentData.startDate,
      endDate: tournamentData.endDate,
      livePlay: tournamentData.livePlay,
      currentRound: tournamentData.currentRound,
      seasonId: tournamentData.seasonId,
      courseId: tournamentData.courseId,
      tierId: tournamentData.tierId,
      course: {
        id: tournamentData.course.id,
        name: tournamentData.course.name,
        location: tournamentData.course.location,
        par: tournamentData.course.par,
        apiId: tournamentData.course.apiId,
      },
      tier: {
        id: tournamentData.tier.id,
        name: tournamentData.tier.name,
        seasonId: tournamentData.tier.seasonId,
      },
    };

    // Get champions
    const championTeams = await db.team.findMany({
      where: {
        tournamentId: tournamentId,
        position: "1",
      },
      include: {
        tournament: true,
      },
      orderBy: [{ earnings: "desc" }],
    });

    // Fetch related data for enrichment
    const [tours, tourCards] = await Promise.all([
      db.tour.findMany(),
      db.tourCard.findMany({
        include: {
          tour: true,
          member: true,
        },
      }),
    ]);

    // Enrich champions
    const enrichedChampions = championTeams.map((team) => {
      const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);
      const tour = tourCard
        ? tours.find((t) => t.id === tourCard.tourId)
        : null;

      return {
        ...team,
        tour: tour || { id: "unknown", name: "Unknown" },
        tourCard: tourCard || null,
      };
    });

    return {
      tournament,
      champs: enrichedChampions as any,
      error: null,
      isLoading: false,
    };
  } catch (error) {
    console.error("Error fetching champions by tournament:", error);
    return {
      tournament: undefined,
      champs: [],
      error: error instanceof Error ? error.message : "Unknown error",
      isLoading: false,
    };
  }
}
