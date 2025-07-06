/**
 * Leaderboard Header Actions
 *
 * Server actions for fetching data needed by the leaderboard header component.
 * Uses tournament utilities for proper data processing and business logic.
 */

import { api } from "@/trpc/server";
import type { Tournament, Course, Tier } from "@prisma/client";
import { getByStatus } from "@/lib/utils/domain/tournaments";
import type { TournamentWithIncludes } from "@/app/(main)/tournament/_components/header/LeaderboardHeader";

export interface LeaderboardHeaderData {
  course: Course | undefined;
  tier: Tier | undefined;
  tournaments: TournamentWithIncludes[];
  tiers: Tier[];
  groupedTournaments: {
    byTier: TournamentWithIncludes[][];
    byDate: TournamentWithIncludes[][];
  };
  courses: Course[];
}

/**
 * Fetches and processes all data needed for the leaderboard header component
 * Uses tournament utilities for proper business logic and data processing
 *
 * @param focusTourney - The tournament to fetch data for
 * @returns Promise containing processed course, tier, tournaments, and grouped data
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

  // Extract unique courses from tournaments using utility functions
  const courses = tournaments
    .map((t) => t.course)
    .filter((course): course is Course => course !== undefined)
    .reduce((unique, course) => {
      if (!unique.find((c) => c.id === course.id)) {
        unique.push(course);
      }
      return unique;
    }, [] as Course[]);

  // Group tournaments using utility functions and proper typing
  const groupedTournaments = {
    // Group by tier
    byTier: Object.values(
      tournaments.reduce(
        (groups, tournament) => {
          const tierId = tournament.tierId;
          if (!groups[tierId]) groups[tierId] = [];
          groups[tierId].push(tournament);
          return groups;
        },
        {} as Record<string, TournamentWithIncludes[]>,
      ),
    ),

    // Group by date/status - convert to base Tournament for utility functions
    byDate: [
      getByStatus(
        tournaments.map((t) => ({
          ...t,
          startDate: t.startDate,
          endDate: t.endDate,
        })),
        "current",
      ),
      getByStatus(
        tournaments.map((t) => ({
          ...t,
          startDate: t.startDate,
          endDate: t.endDate,
        })),
        "upcoming",
      ),
      getByStatus(
        tournaments.map((t) => ({
          ...t,
          startDate: t.startDate,
          endDate: t.endDate,
        })),
        "completed",
      ),
    ]
      .filter((group) => group.length > 0)
      .map((group) =>
        group.map(
          (baseTournament) =>
            tournaments.find((t) => t.id === baseTournament.id)!,
        ),
      ),
  };

  return {
    course,
    tier,
    tournaments,
    tiers,
    groupedTournaments,
    courses,
  };
}
