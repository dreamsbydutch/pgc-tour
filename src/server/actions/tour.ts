import { api } from "@/trpc/server";

/**
 * getToursBySeason
 *
 * Fetches all tournaments (tours) for a given seasonId from the database.
 *
 * @param seasonId - The ID of the season to fetch tournaments for
 * @returns An array of tournament objects for the specified season
 */
export async function getToursBySeason(seasonId: string) {
  if (!seasonId) throw new Error("seasonId is required");
  return api.tour.getBySeason({
    seasonId,
  });
}
