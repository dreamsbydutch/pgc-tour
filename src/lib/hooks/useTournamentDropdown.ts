/**
 * Tournament Dropdown Hook
 *
 * Custom hook for HeaderDropdownMenu that encapsulates all data fetching,
 * transformation, and UI logic needed for the tournament dropdown component.
 *
 * This hook removes all logic from the HeaderDropdownMenu component,
 * making it purely presentational.
 */

import { api } from "@/trpc/react";
import { useMemo } from "react";
import type { Course, Tier, Tournament } from "@prisma/client";

export type TournamentWithIncludes = Tournament & {
  course: Course;
  tier: Tier;
};

export type TournamentGroup = TournamentWithIncludes[][];

export interface TournamentDropdownData {
  // Data
  tournaments: TournamentWithIncludes[];
  tiers: Tier[];
  courses: Course[];
  currentTournament: TournamentWithIncludes | null;

  // Computed data based on view mode
  groupedTournaments: TournamentGroup;

  // Loading and error states
  isLoading: boolean;
  error: unknown;

  // Utility functions
  getTierName: (
    tierName: string | undefined,
    groupIndex: number,
    isLive: boolean,
  ) => string;
  getTournamentHref: (
    tournamentId: string,
    viewMode: string,
    groupIndex: number,
    hasLiveTournament: boolean,
  ) => string;
}

export function useTournamentDropdown(
  viewMode: "Tier" | "Date" = "Date",
): TournamentDropdownData {
  // Fetch current season
  const {
    data: currentSeason,
    isLoading: seasonLoading,
    error: seasonError,
  } = api.season.getCurrent.useQuery();

  // Fetch tournaments for current season
  const {
    data: tournaments = [],
    isLoading: tournamentsLoading,
    error: tournamentsError,
  } = api.tournament.getBySeason.useQuery(
    { seasonId: currentSeason?.id ?? "" },
    { enabled: !!currentSeason?.id },
  );

  // Fetch tiers for current season
  const {
    data: tiers = [],
    isLoading: tiersLoading,
    error: tiersError,
  } = api.tier.getBySeason.useQuery(
    { seasonId: currentSeason?.id ?? "" },
    { enabled: !!currentSeason?.id },
  );

  // Fetch courses
  const {
    data: courses = [],
    isLoading: coursesLoading,
    error: coursesError,
  } = api.course.getAll.useQuery();

  // Fetch current tournament
  const {
    data: currentTournament,
    isLoading: currentTournamentLoading,
    error: currentTournamentError,
  } = api.tournament.getCurrent.useQuery();

  const isLoading =
    seasonLoading ||
    tournamentsLoading ||
    tiersLoading ||
    coursesLoading ||
    currentTournamentLoading;

  const error =
    seasonError ||
    tournamentsError ||
    tiersError ||
    coursesError ||
    currentTournamentError;

  const computedData = useMemo(() => {
    if (!tournaments || !tiers) {
      return {
        sortedTiers: [],
        groupedTournaments: [] as TournamentGroup,
        hasLiveTournament: false,
      };
    }

    // Sort tiers by points (highest first)
    const sortedTiers = [...tiers].sort(
      (a, b) => (b.points[0] ?? 0) - (a.points[0] ?? 0),
    );

    let groupedTournaments: TournamentGroup;
    let hasLiveTournament = false;

    if (viewMode === "Tier") {
      // Group tournaments by tier, with current tournament first if it exists
      const tournamentsByTier = sortedTiers.map((tier) =>
        tournaments.filter((tournament) => tournament.tierId === tier.id),
      );

      if (currentTournament) {
        hasLiveTournament = true;
        groupedTournaments = [
          [currentTournament as TournamentWithIncludes],
          ...tournamentsByTier,
        ];
      } else {
        groupedTournaments = tournamentsByTier;
      }
    } else {
      // All tournaments in a single group for date view
      groupedTournaments = [tournaments];
    }

    return {
      sortedTiers,
      groupedTournaments,
      hasLiveTournament,
    };
  }, [tournaments, tiers, currentTournament, viewMode]);

  // Utility function to get tier name for display
  const getTierName = (
    tierName: string | undefined,
    groupIndex: number,
    isLive: boolean,
  ): string => {
    if (viewMode !== "Tier") return "";

    if (isLive && groupIndex === 0) {
      return "Live";
    }

    return tierName ?? "";
  };

  // Utility function to get tournament href
  const getTournamentHref = (
    tournamentId: string,
    currentViewMode: string,
    groupIndex: number,
    hasLiveTournament: boolean,
  ): string => {
    const basePathname = "/tournament";

    // If viewing by tier and this is the first group with a live tournament,
    // link to current tournament (no ID)
    if (currentViewMode === "Tier" && hasLiveTournament && groupIndex === 0) {
      return basePathname;
    }

    return `${basePathname}?id=${tournamentId}`;
  };

  return {
    // Data
    tournaments,
    tiers: computedData.sortedTiers,
    courses,
    currentTournament: currentTournament as TournamentWithIncludes | null,

    // Computed data
    groupedTournaments: computedData.groupedTournaments,

    // Loading and error states
    isLoading,
    error,

    // Utility functions
    getTierName,
    getTournamentHref,
  };
}
