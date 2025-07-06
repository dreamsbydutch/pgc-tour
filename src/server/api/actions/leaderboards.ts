/**
 * Leaderboard Server Actions
 * Server-side equivalent of useLeaderboard hook
 *
 * Provides leaderboard data with team enrichment for server-side rendering
 * and server components. Returns the same data structure as the client hook.
 */

import { db } from "@/server/db";
import type {
  LeaderboardResult,
  MinimalTournament,
  TourGroup,
} from "@/lib/types";
import { getCurrentTournament } from "./tournaments";
import { sortTeamsByProperties } from "@/lib/utils/domain/teams";

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

    // Define the enriched team type
    type EnrichedTeam = (typeof rawTeams)[number] & {
      tourCard: (typeof tourCards)[number] | null;
      tour:
        | (typeof tours)[number]
        | { id: string; name: string; seasonId: string };
    };

    // Group teams by tour and enrich with tourCard and tour info
    const tourGroupsMap = new Map<
      string,
      Omit<TourGroup, "teams"> & { teams: EnrichedTeam[] }
    >();

    for (const team of rawTeams) {
      const tourCard =
        tourCards.find((tc) => tc.id === team.tourCardId) ?? null;
      const tour = tourCard
        ? tours.find((t) => t.id === tourCard.tourId)
        : null;
      const tourId = tour?.id || "unknown";
      const tourInfo = tour || {
        id: "unknown",
        name: "Unknown",
        seasonId: tournament!.seasonId,
      };

      const teamWithTourCard: EnrichedTeam = {
        ...team,
        tourCard,
        tour: tourInfo,
      };

      if (!tourGroupsMap.has(tourId)) {
        tourGroupsMap.set(tourId, {
          tour: tourInfo as any,
          teams: [],
          teamCount: 0,
        });
      }
      const group = tourGroupsMap.get(tourId)!;
      group.teams.push(teamWithTourCard);
      group.teamCount++;
    }

    // Sort teams in each tour group before output
    const teamsByTour: any[] = Array.from(tourGroupsMap.values())
      .map((group) => ({
        ...group,
        teams: sortTeamsByProperties(group.teams, [
          { property: "position", direction: "asc" },
          { property: "score", direction: "asc" },
          { property: "name", direction: "asc" },
        ]),
      }))
      .sort((a, b) => a.tour.id.localeCompare(b.tour.id)); // Sort by tour id

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
