/**
 * @file leaderboard-header.ts
 * @description
 *   Server action for fetching and processing all data needed by the leaderboard header component.
 *   Fetches tournaments, tiers, and courses for the season, finds the focus tournament, and groups tournaments by tier for dropdowns.
 *   All types and return values are fully documented for IntelliSense and maintainability.
 *
 *   Usage:
 *     const data = await getLeaderboardHeaderData(focusTourney);
 *     data.focusTourney, data.course, data.tier, data.groupedTournaments, etc.
 */

import { api } from "@/trpc/server";
import type { Tournament, Course } from "@prisma/client";

/**
 * Dropdown item for grouped tournaments by tier.
 */
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
/**
 * Grouped tournaments for dropdown: array of arrays, each group is a tier.
 */
type GroupedTournaments = GroupedTournamentDropdownItem[][];

/**
 * Props returned for the leaderboard header component.
 */
export interface LeaderboardHeaderProps {
  focusTourney: {
    id: string;
    logoUrl: string | null;
    name: string;
    startDate: Date;
    endDate: Date;
    currentRound: number | null;
  };
  course?: {
    name: string;
    location: string;
    par: number;
    front: number;
    back: number;
  };
  tier?: { name: string; points: number[]; payouts: number[] };
  groupedTournaments: GroupedTournaments;
  isLoading?: boolean;
}

/**
 * Fetches and processes all data needed for the leaderboard header component.
 *
 * @param focusTourney - The tournament to fetch data for (must include season and tier ids)
 * @returns Promise containing processed course, tier, tournaments, and grouped data
 *
 * @example
 *   const data = await getLeaderboardHeaderData(focusTourney);
 *   data.groupedTournaments.forEach(...)
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

  const tierObj = tiers.find((t) => t.id === focusTourney.tier.id);
  const tier = tierObj
    ? {
        name: tierObj.name,
        points: tierObj.points,
        payouts: tierObj.payouts,
      }
    : undefined;

  // Group tournaments by tier for dropdown
  const groupedTournaments: GroupedTournaments = Object.values(
    tournaments.reduce<Record<string, (Tournament & { course: Course })[]>>(
      (groups, tournament) => {
        const tierId = tournament.tierId;
        if (!groups[tierId]) groups[tierId] = [];
        groups[tierId].push(tournament);
        return groups;
      },
      {},
    ),
  ).map((group) =>
    group.map((tournament) => {
      const tierObj = tiers.find((tier) => tier.id === tournament.tierId);
      return {
        tournament: {
          id: tournament.id,
          logoUrl: tournament.logoUrl,
          name: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
        },
        tier: { name: tierObj?.name ?? "" },
        course: { location: tournament.course.location ?? "" },
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
