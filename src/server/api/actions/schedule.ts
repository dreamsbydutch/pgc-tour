import { api } from "@/trpc/server";

/**
 * Server action to get the current season's tournament schedule
 * Returns tournaments with tier and course information included
 */
export async function getCurrentSchedule() {
  try {
    // Get current season
    const currentSeason = await api.season.getCurrent();

    if (!currentSeason) {
      return [];
    }

    // Get tournaments for current season with tier and course included
    const tournaments = await api.tournament.getBySeason({
      seasonId: currentSeason.id,
    });

    return tournaments;
  } catch (error) {
    console.error("Error fetching current schedule:", error);
    return [];
  }
}
