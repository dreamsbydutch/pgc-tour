/**
 * Golfer Server Actions
 * Server-side golfer data management and business logic
 *
 * Handles golfer usage calculations, updates, and tournament-specific operations.
 */

"use server";

import { api } from "../../../trpc/server";
import { db } from "../../db";
import type { Golfer } from "@prisma/client";

/**
 * Update golfer usage percentages for a tournament
 * Calculates how frequently each golfer is being used across teams
 */
export async function updateUsageForTournament({
  tournamentId,
}: {
  tournamentId: string;
}) {
  try {
    const teams = await api.team.getByTournament({
      tournamentId,
    });
    const golfers = await api.golfer.getByTournament({
      tournamentId,
    });

    // Process golfers with zero usage
    const updates = golfers
      .filter((golfer) => golfer.usage === 0)
      .map(async (golfer) => {
        const usageTeams = teams.filter((team) =>
          team.golferIds.includes(golfer.apiId),
        );

        if (usageTeams.length === 0) return null;

        const usage = usageTeams.length / teams.length;
        return updateGolferUsage({
          golferId: golfer.id,
          usage,
        });
      });

    // Wait for all updates to complete
    await Promise.all(updates);

    return { success: true, updated: updates.length };
  } catch (error) {
    console.error("Error updating golfer usage:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update a specific golfer's usage percentage
 * Internal helper function for usage calculations
 */
async function updateGolferUsage({
  golferId,
  usage,
}: {
  golferId: number;
  usage: number;
}) {
  return await api.golfer.update({
    id: golferId,
    usage,
  });
}

/**
 * Get golfers by tournament with usage statistics
 * Enhanced version that includes usage calculations
 */
export async function getGolfersWithUsage(tournamentId: string) {
  try {
    const [golfers, teams] = await Promise.all([
      api.golfer.getByTournament({ tournamentId }),
      api.team.getByTournament({ tournamentId }),
    ]);

    // Calculate usage for each golfer
    const golfersWithUsage = golfers.map((golfer) => {
      const usageTeams = teams.filter((team) =>
        team.golferIds.includes(golfer.apiId),
      );
      const calculatedUsage =
        teams.length > 0 ? usageTeams.length / teams.length : 0;

      return {
        ...golfer,
        calculatedUsage,
        teamCount: usageTeams.length,
        totalTeams: teams.length,
      };
    });

    return golfersWithUsage;
  } catch (error) {
    console.error("Error getting golfers with usage:", error);
    return [];
  }
}

/**
 * Get top performing golfers by earnings or usage
 * Useful for analytics and recommendations
 */
export async function getTopGolfers(
  limit: number = 10,
  sortBy: "earnings" | "usage" | "performance" = "earnings",
) {
  try {
    const golfers = await db.golfer.findMany({
      orderBy:
        sortBy === "earnings"
          ? { earnings: "desc" }
          : sortBy === "usage"
            ? { usage: "desc" }
            : { earnings: "desc" }, // Default fallback
      take: limit,
    });

    return golfers;
  } catch (error) {
    console.error("Error getting top golfers:", error);
    return [];
  }
}
