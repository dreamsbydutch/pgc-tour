/**
 * Team Server Actions
 * Server-side team creation and management operations
 *
 * Handles team creation for tournaments and team-related business logic.
 */

"use server";

import { api } from "@/trpc/server";
import { db } from "@/server/db";

/**
 * Process team creation form submission
 * Creates a new team for a tournament with selected golfers
 */
export async function teamCreateOnFormSubmit({
  value,
  tournamentId,
  tourCardId,
}: {
  value: {
    groups: { golfers: number[] }[];
  };
  tournamentId: string;
  tourCardId: string;
}) {
  try {
    const golferIds = value.groups.flatMap((group) => group.golfers);

    const newTeam = await api.team.create({
      golferIds,
      tourCardId: tourCardId,
      tournamentId: tournamentId,
    });

    return { success: true, team: newTeam };
  } catch (error) {
    console.error("Error creating team:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update team golfers for an existing team
 * Allows modification of team composition before tournament starts
 */
export async function updateTeamGolfers({
  teamId,
  golferIds,
}: {
  teamId: number;
  golferIds: number[];
}) {
  try {
    const updatedTeam = await api.team.update({
      id: teamId,
      golferIds,
    });

    return { success: true, team: updatedTeam };
  } catch (error) {
    console.error("Error updating team golfers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a team
 * Removes a team from a tournament (only allowed before tournament starts)
 */
export async function deleteTeam(teamId: number) {
  try {
    await api.team.delete({ id: teamId });
    return { success: true };
  } catch (error) {
    console.error("Error deleting team:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get teams for a tournament with enhanced data
 * Returns teams with golfer details and tour card information
 */
export async function getTeamsForTournament(tournamentId: string) {
  try {
    const teams = await db.team.findMany({
      where: { tournamentId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: [{ position: "asc" }, { earnings: "desc" }],
    });

    // Get tour cards for additional context
    const tourCardIds = teams.map((team) => team.tourCardId);
    const tourCards = await db.tourCard.findMany({
      where: { id: { in: tourCardIds } },
      include: {
        member: {
          select: { id: true, firstname: true, lastname: true },
        },
        tour: {
          select: { id: true, name: true },
        },
      },
    });

    // Enrich teams with tour card data
    const enrichedTeams = teams.map((team) => {
      const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);
      return {
        ...team,
        member: tourCard?.member,
        tour: tourCard?.tour,
        displayName: tourCard?.displayName,
      };
    });

    return { success: true, teams: enrichedTeams };
  } catch (error) {
    console.error("Error getting teams for tournament:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      teams: [],
    };
  }
}

/**
 * Get team performance statistics
 * Returns analytics for a specific team
 */
export async function getTeamStats(teamId: number) {
  try {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        tournament: true,
      },
    });

    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Calculate team statistics
    const rounds = [
      team.roundOne,
      team.roundTwo,
      team.roundThree,
      team.roundFour,
    ].filter((round) => round !== null);

    const averageRound =
      rounds.length > 0
        ? rounds.reduce((sum, round) => sum + (round || 0), 0) / rounds.length
        : 0;

    const stats = {
      totalEarnings: team.earnings || 0,
      totalPoints: team.points || 0,
      position: team.position,
      roundsPlayed: rounds.length,
      averageScore: averageRound,
      madeCut: team.makeCut || 0,
      currentScore: team.today || 0,
      holesThrough: team.thru || 0,
    };

    return {
      success: true,
      team: {
        ...team,
        stats,
      },
    };
  } catch (error) {
    console.error("Error getting team stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
