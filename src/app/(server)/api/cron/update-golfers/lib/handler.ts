/**
 * Simple handler for the golfer update cron job
 */

import { db } from "@pgc-server";
import type { CronJobResult } from "./types";
import { updateAllGolfersOptimized } from "./service";

export async function handleGolferUpdateCron(
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

    // Get current tournament
    const tournament = await db.tournament.findFirst({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        course: true,
      },
      orderBy: { startDate: "desc" },
    });

    if (!tournament) {
      return {
        success: false,
        message: "No current tournament",
        error: "No current tournament",
        status: 404,
      };
    }

    console.log(
      `🏌️ Processing golfer updates for tournament: ${tournament.name}`,
    );

    // Update golfers
    const result = await updateAllGolfersOptimized(tournament);

    console.log(
      `✅ Update completed: ${result.golfersUpdated} updated, ${result.golfersCreated} created, ${result.fieldsUpdated} fields changed`,
    );

    return {
      success: true,
      message: "Golfers updated successfully",
      redirect: `${origin}${next}`,
      stats: {
        totalGolfers: result.golfersUpdated + result.golfersCreated,
        liveGolfersCount: result.liveGolfersCount,
        eventName: "Current Tournament",
        tournamentName: tournament.name,
      },
    };
  } catch (error) {
    console.error("Error in golfer update cron job:", error);
    return {
      success: false,
      message: "Internal server error",
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}
