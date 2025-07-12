import { db } from "@pgc-server";

/**
 * getTiersBySeason
 *
 * Fetches all tiers for a given seasonId from the database.
 *
 * @param seasonId - The ID of the season to fetch tiers for
 * @returns An array of tier objects for the specified season
 */
export async function getTiersBySeason(seasonId: string) {
  if (!seasonId) throw new Error("seasonId is required");
  return db.tier.findMany({
    where: { seasonId },
    orderBy: { name: "asc" },
  });
}
