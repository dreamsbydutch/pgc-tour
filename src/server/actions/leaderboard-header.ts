/**
 * Leaderboard Header Actions
 *
 * Server actions for fetching data needed by the leaderboard header component.
 * Uses tournament utilities for proper data processing and business logic.
 */

import { MinimalTournament } from "@/lib/types";
import { api } from "@/trpc/server";
import type { Tournament } from "@prisma/client";

// Define a type for the grouped tournament dropdown items
type GroupedTournamentDropdownItem = {
  tournament: {
    id: string;
    logoUrl: string | null;
    name: string;
    startDate: Date;
    endDate: Date;
  };
  tier: { name: string };
  course: { location: string };
};
type GroupedTournaments = GroupedTournamentDropdownItem[][];

// Pure presentational component
interface LeaderboardHeaderProps {
  focusTourney: {
    id: string;
    logoUrl: string | null;
    name: string;
    startDate: Date;
    endDate: Date;
    currentRound: number | null;
  };
  course:
    | {
        name: string;
        location: string;
        par: number;
        front: number;
        back: number;
      }
    | undefined;
  tier: { name: string; points: number[]; payouts: number[] } | undefined;
  groupedTournaments: GroupedTournaments;
  isLoading?: boolean;
}

/**
 * Fetches and processes all data needed for the leaderboard header component
 * Uses tournament utilities for proper business logic and data processing
 *
 * @param focusTourney - The tournament to fetch data for
 * @returns Promise containing processed course, tier, tournaments, and grouped data
 */
export async function getLeaderboardHeaderData(focusTourney: {
  id: string;
  logoUrl: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
  currentRound: number | null;
  season: { id: string };
  tier: { id: string };
}): Promise<LeaderboardHeaderProps> {
  // Fetch tournaments, tiers, and courses in parallel
  const [tournaments, tiers, courses] = await Promise.all([
    api.tournament.getBySeason({ seasonId: focusTourney.season.id }),
    api.tier.getBySeason({ seasonId: focusTourney.season.id }),
    api.course.getAll(),
  ]);

  // Find the specific tournament and tier data
  const tournamentWithCourse = tournaments.find(
    (t) => t.id === focusTourney.id,
  );
  const course = tournamentWithCourse?.course
    ? {
        name: tournamentWithCourse.course.name,
        location: tournamentWithCourse.course.location,
        par: tournamentWithCourse.course.par,
        front: tournamentWithCourse.course.front,
        back: tournamentWithCourse.course.back,
      }
    : undefined;

  const tier = tiers.find((t) => t.id === focusTourney.tier.id)
    ? {
        name: tiers.find((t) => t.id === focusTourney.tier.id)!.name,
        points: tiers.find((t) => t.id === focusTourney.tier.id)!.points,
        payouts: tiers.find((t) => t.id === focusTourney.tier.id)!.payouts,
      }
    : undefined;

  // Group tournaments by tier for dropdown
  const groupedTournaments: GroupedTournaments = Object.values(
    tournaments.reduce(
      (groups, tournament) => {
        const tierId = tournament.tierId;
        if (!groups[tierId]) groups[tierId] = [];
        groups[tierId].push(tournament);
        return groups;
      },
      {} as Record<string, Tournament[]>,
    ),
  ).map((group) =>
    group.map((tournament) => {
      const tierObj = tiers.find((tier) => tier.id === tournament.tierId);
      const courseObj = courses.find(
        (course) => course.id === tournament.courseId,
      );
      return {
        tournament: {
          id: tournament.id,
          logoUrl: tournament.logoUrl,
          name: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
        },
        tier: { name: tierObj?.name ?? "" },
        course: { location: courseObj?.location ?? "" },
      };
    }),
  );

  return {
    focusTourney: {
      id: focusTourney.id,
      logoUrl: focusTourney.logoUrl,
      name: focusTourney.name,
      startDate: focusTourney.startDate,
      endDate: focusTourney.endDate,
      currentRound: focusTourney.currentRound,
    },
    course,
    tier,
    groupedTournaments,
    isLoading: false,
  };
}
