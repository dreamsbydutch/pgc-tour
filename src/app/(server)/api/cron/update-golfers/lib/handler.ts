/**
 * Main handler for the golfer update cron job
 * Clean, focused orchestration with minimal logging
 */

import { api } from "@pgc-trpcServer";
import type { CronJobResult } from "./types";
import {
  fetchExternalData,
  createMissingGolfers,
  updateAllGolfers,
  updateTournamentStatus,
} from "./services";

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

    // Fetch external data
    const { liveData, fieldData, rankingsData } = await fetchExternalData();

    // Get current tournament
    const tournament = (await api.tournament.getInfo()).current;
    if (!tournament) {
      return {
        success: false,
        message: "No current tournament",
        error: "No current tournament",
        status: 404,
      };
    }

    // Get existing golfers and teams
    const [golfers, teams] = await Promise.all([
      api.golfer.getByTournament({ tournamentId: tournament.id }),
      api.team.getByTournament({ tournamentId: tournament.id }),
    ]);

    // Create missing golfers
    await createMissingGolfers(
      fieldData.field,
      golfers,
      rankingsData,
      tournament,
    );

    // Update existing golfers
    const { liveGolfersCount } = await updateAllGolfers(
      golfers,
      liveData,
      fieldData,
      tournament,
      teams,
    );

    // Update tournament status
    await updateTournamentStatus(tournament, golfers, liveGolfersCount);

    return {
      success: true,
      message: "Golfers updated successfully",
      redirect: `${origin}${next}`,
      stats: {
        totalGolfers: golfers.length,
        liveGolfersCount,
        eventName: liveData.info.event_name,
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
