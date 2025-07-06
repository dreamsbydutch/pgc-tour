/**
 * Leaderboard Header Actions
 *
 * Server actions for fetching data needed by the leaderboard header component.
 * Abstracts database queries from the component for better separation of concerns.
 */

import { api } from "@/trpc/server";
import type { Tournament, Course, Tier } from "@prisma/client";
import type { TournamentWithIncludes } from "@/app/(main)/tournament/_components/header/LeaderboardHeader";

export interface LeaderboardHeaderData {
  course: Course | undefined;
  tier: Tier | undefined;
  tournaments: TournamentWithIncludes[];
  tiers: Tier[];
}

/**
 * Fetches all data needed for the leaderboard header component
 *
 * @param focusTourney - The tournament to fetch data for
 * @returns Promise containing course, tier, tournaments, and tiers data
 */
export async function getLeaderboardHeaderData(
  focusTourney: Tournament,
): Promise<LeaderboardHeaderData> {
  // Fetch static database data in parallel for better performance
  const [tournaments, tiers] = await Promise.all([
    api.tournament.getBySeason({ seasonId: focusTourney.seasonId }),
    api.tier.getBySeason({ seasonId: focusTourney.seasonId }),
  ]);

  // Find the specific tournament and tier data
  const tournamentWithCourse = tournaments.find(
    (t) => t.id === focusTourney.id,
  );
  const course = tournamentWithCourse?.course;
  const tier = tiers.find((t) => t.id === focusTourney.tierId);

  return {
    course,
    tier,
    tournaments,
    tiers,
  };
}
