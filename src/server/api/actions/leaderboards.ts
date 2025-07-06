/**
 * Leaderboard Server Actions
 * Server-side equivalent of useLeaderboard hook
 *
 * Provides leaderboard data with team enrichment for server-side rendering
 * and server components. Returns the same data structure as the client hook.
 */

import { db } from "@/src/server/db";
import type {
  LeaderboardResult,
  MinimalTournament,
  TourGroup,
} from "@/src/lib/types";
import { getCurrentTournament } from "./tournaments";

/**
 * Get leaderboard data for a tournament
 * Server equivalent of useLeaderboard()
 */
export async function getLeaderboardData(
  tournamentId?: string,
): Promise<LeaderboardResult> {
  try {
    let targetTournamentId = tournamentId;
    let tournament: MinimalTournament | undefined = undefined;

    // If no tournament ID provided, get current tournament
    if (!targetTournamentId) {
      const current = await getCurrentTournament();
      if (!current) {
        return {
          tournament: undefined,
          teamsByTour: [],
          totalTeams: 0,
          isLoading: false,
          error: "No current tournament available",
        };
      }
      targetTournamentId = current.id;
      tournament = current;
    } else {
      // Fetch specific tournament details
      const tournamentData = await db.tournament.findUnique({
        where: { id: targetTournamentId },
        include: {
          course: true,
          tier: true,
        },
      });

      if (tournamentData) {
        tournament = {
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
      }
    }

    if (!tournament) {
      return {
        tournament: undefined,
        teamsByTour: [],
        totalTeams: 0,
        isLoading: false,
        error: "Tournament not found",
      };
    }

    // Fetch teams for the tournament
    const rawTeams = await db.team.findMany({
      where: { tournamentId: targetTournamentId },
      include: {
        tournament: true,
      },
      orderBy: [{ position: "asc" }],
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

    // Group teams by tour manually to match TourGroup interface
    const tourGroupsMap = new Map<string, TourGroup>();

    rawTeams.forEach((team) => {
      // Find the tour for this team using tourCardId
      const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);
      const tour = tourCard
        ? tours.find((t) => t.id === tourCard.tourId)
        : null;

      const tourId = tour?.id || "unknown";
      const tourInfo = tour || {
        id: "unknown",
        name: "Unknown",
        seasonId: tournament!.seasonId,
      };

      const existingGroup = tourGroupsMap.get(tourId);

      if (existingGroup) {
        existingGroup.teams.push(team as any);
        existingGroup.teamCount++;
      } else {
        tourGroupsMap.set(tourId, {
          tour: tourInfo as any,
          teams: [team as any],
          teamCount: 1,
        });
      }
    });

    const teamsByTour = Array.from(tourGroupsMap.values());

    return {
      tournament,
      teamsByTour,
      totalTeams: rawTeams.length,
      lastUpdated: new Date(),
      isLoading: false,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return {
      tournament: undefined,
      teamsByTour: [],
      totalTeams: 0,
      isLoading: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get current tournament leaderboard
 * Convenience function for server components
 */
export async function getCurrentLeaderboard(): Promise<LeaderboardResult> {
  return getLeaderboardData();
}

/**
 * Get historical leaderboard for a specific tournament
 * Convenience function for server components
 */
export async function getHistoricalLeaderboard(
  tournamentId: string,
): Promise<LeaderboardResult> {
  return getLeaderboardData(tournamentId);
}
