/**
 * Handler for the team update cron job
 */

import { db } from "@pgc-server";
import type { CronJobResult } from "./types";
import { updateAllTeamsOptimized } from "./service";

export async function handleTeamUpdateCron(
  request: Request,
): Promise<CronJobResult> {
  try {
    // Security check (uncomment for production)
    // const cronSecret = process.env.CRON_SECRET;
    // if (cronSecret) {
    //   const providedSecret = request.headers.get("x-cron-secret");
    //   if (providedSecret !== cronSecret) {
    //     return { success: false, message: "Unauthorized", error: "Unauthorized", status: 401 };
    //   }
    // }

    const { searchParams, origin } = new URL(request.url);
    const next = searchParams.get("next") ?? "/";

    // Get current tournament with all relations
    const tournament = await db.tournament.findFirst({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        course: true,
        tier: true,
        golfers: true,
        teams: true,
        tours: true,
      },
      orderBy: { startDate: "desc" },
    });
    const tourCards = await db.tourCard.findMany({
      where: {
        seasonId: tournament?.seasonId,
      },
      include: {
        member: true,
        tour: true,
      },
    });

    if (!tournament) {
      return {
        success: false,
        message: "No current tournament",
        error: "No current tournament",
        status: 404,
      };
    }
    if (!tourCards) {
      return {
        success: false,
        message: "No current tourCards",
        error: "No current tourCards",
        status: 404,
      };
    }

    console.log(
      `⚡ Processing team updates for tournament: ${tournament.name}`,
    );

    // Update teams
    const result = await updateAllTeamsOptimized(tournament, tourCards);

    console.log(
      `✅ Team update completed: ${result.teamsUpdated} teams updated`,
    );

    return {
      success: true,
      message: "Teams updated successfully",
      redirect: `${origin}${next}`,
      stats: {
        totalTeams: result.totalTeams,
        teamsUpdated: result.teamsUpdated,
        tournamentName: tournament.name,
        currentRound: tournament.currentRound ?? 1,
        livePlay: tournament.livePlay ?? false,
      },
    };
  } catch (error) {
    console.error("Error in team update cron job:", error);
    return {
      success: false,
      message: "Internal server error",
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}
