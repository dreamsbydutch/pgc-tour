/**
 * Leaderboard Header Hook
 *
 * Custom hook that encapsulates all data fetching, state management, and logic
 * needed for the LeaderboardHeader component. This removes all logic from the
 * container component, making it purely a data-passing component.
 */

import { useState } from "react";
import { api } from "@/trpc/react";
import { useTournamentDropdown } from "@/lib/hooks";
import { useCourseData } from "@/lib/hooks/useCourseData";
import type { Tournament, Course, Tier } from "@prisma/client";
import type { TournamentGroup } from "@/app/(main)/tournament/_components/header/LeaderboardHeader";
import type { DatagolfCourseInputData } from "@/lib/types";

export interface LeaderboardHeaderData {
  // Leaderboard data
  course: Course | undefined;
  tier: Tier | undefined;

  // Course data from DataGolf
  courseData: DatagolfCourseInputData | undefined;
  courseDataLoading: boolean;

  // Dropdown data and state
  groupedTournaments: TournamentGroup;
  dropdownTiers: Tier[];
  dropdownCourses: Course[];
  dropdownLoading: boolean;
  leaderboardToggle: "Tier" | "Date";
  onToggleChange: (toggle: "Tier" | "Date") => void;

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

  // Loading states
  isLoading: boolean;
}

export function useLeaderboardHeader(
  focusTourney: Tournament,
): LeaderboardHeaderData {
  // Dropdown state management
  const [leaderboardToggle, setLeaderboardToggle] = useState<"Tier" | "Date">(
    "Date",
  );

  // Fetch tournaments to get course information
  const { data: tournaments = [], isLoading: tournamentsLoading } =
    api.tournament.getBySeason.useQuery(
      { seasonId: focusTourney.seasonId },
      { enabled: !!focusTourney.seasonId },
    );

  // Fetch tiers to get tier information
  const { data: tiers = [], isLoading: tiersLoading } =
    api.tier.getBySeason.useQuery(
      { seasonId: focusTourney.seasonId },
      { enabled: !!focusTourney.seasonId },
    );

  // Fetch course data from DataGolf
  const { data: courseData, isLoading: courseDataLoading } = useCourseData();

  // Dropdown data fetching using existing hook
  const {
    groupedTournaments,
    tiers: dropdownTiers,
    courses: dropdownCourses,
    isLoading: dropdownLoading,
    getTierName,
    getTournamentHref,
  } = useTournamentDropdown(leaderboardToggle);

  // Data transformation logic
  const tournamentWithCourse = tournaments.find(
    (t) => t.id === focusTourney.id,
  );
  const course = tournamentWithCourse?.course;
  const tier = tiers.find((t) => t.id === focusTourney.tierId);

  // Combined loading state
  const isLoading = tournamentsLoading || tiersLoading || dropdownLoading;

  return {
    // Leaderboard data
    course,
    tier,

    // Course data from DataGolf
    courseData,
    courseDataLoading,

    // Dropdown data and state
    groupedTournaments,
    dropdownTiers,
    dropdownCourses,
    dropdownLoading,
    leaderboardToggle,
    onToggleChange: setLeaderboardToggle,

    // Utility functions
    getTierName,
    getTournamentHref,

    // Loading states
    isLoading,
  };
}
