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

import { api } from "@/trpc/server";
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

/**
 * Get latest champions with full team details including golfers
 * Specifically for ChampionsPopup component
 */
export async function getLatestChampions() {
  try {
    // Get all tournaments and find the most recent completed one
    const tournaments = await api.tournament.getAll();
    const now = new Date();
    const completedTournaments = tournaments.filter(
      (t: any) => t.endDate < now,
    );

    if (completedTournaments.length === 0) {
      return {
        tournament: null,
        champs: [],
      };
    }

    // Sort by end date to get the most recent
    const recentTournament = completedTournaments.sort(
      (a: any, b: any) => b.endDate.getTime() - a.endDate.getTime(),
    )[0];

    if (!recentTournament) {
      return {
        tournament: null,
        champs: [],
      };
    }

    // Get all teams for this tournament
    const allTeams = await api.team.getByTournament({
      tournamentId: recentTournament.id,
    });

    // Filter to only champions (position 1)
    const championTeams = allTeams.filter((team: any) => team.position === "1");

    // Get all golfers for this tournament
    const allGolfers = await api.golfer.getByTournament({
      tournamentId: recentTournament.id,
    });

    // Get all tour cards to get tour information
    const allTourCards = await api.tourCard.getAll();
    const allTours = await api.tour.getAll();

    // Enrich champion teams with tour and golfer data
    const enrichedChamps = championTeams.map((team: any) => {
      // Find the tour card and tour
      const tourCard = allTourCards.find(
        (tc: any) => tc.id === team.tourCardId,
      );
      const tour = allTours.find((t: any) => t.id === tourCard?.tourId);

      // Find golfers for this team (you might need to filter by team ID if available in golfer model)
      // For now, since the relationship isn't clear, return empty array
      const teamGolfers: any[] = [];

      return {
        ...team,
        tour: tour || { id: "", name: "Unknown", logoUrl: "" },
        tourCard: tourCard || { displayName: "Unknown" },
        golfers: teamGolfers,
      };
    });

    return {
      tournament: recentTournament,
      champs: enrichedChamps,
    };
  } catch (error) {
    console.error("Error fetching latest champions:", error);
    return {
      tournament: null,
      champs: [],
    };
  }
}
