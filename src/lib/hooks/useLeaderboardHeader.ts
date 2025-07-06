"use client"

/**
 * Leaderboard Header Hook
 *
 * Single hook that handles all leaderboard header logic.
 * Takes server data to avoid refetching, only fetches live course data.
 */

import { useState, useMemo } from "react";
import { useCourseData } from "@/lib/hooks/useCourseData";
import type { Tournament, Course, Tier } from "@prisma/client";
import type { TournamentGroup } from "@/app/(main)/tournament/_components/header/LeaderboardHeader";
import type { DatagolfCourseInputData } from "@/lib/types";

export type TournamentWithIncludes = Tournament & {
  course: Course;
  tier: Tier;
};

export interface LeaderboardHeaderData {
  // Basic data
  course: Course | undefined;
  tier: Tier | undefined;

  // Course data (live from API)
  courseData: DatagolfCourseInputData | undefined;
  courseDataLoading: boolean;

  // Dropdown data and state
  groupedTournaments: TournamentGroup;
  dropdownTiers: Tier[];
  dropdownCourses: Course[];
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
}

export function useLeaderboardHeader(
  focusTourney: Tournament,
  course: Course | undefined,
  tier: Tier | undefined,
  tournaments: TournamentWithIncludes[],
  tiers: Tier[],
): LeaderboardHeaderData {
  // UI state
  const [leaderboardToggle, setLeaderboardToggle] = useState<"Tier" | "Date">(
    "Date",
  );

  // Live course data (only thing we fetch on client)
  const { data: courseData, isLoading: courseDataLoading } = useCourseData();

  // Extract courses from tournaments
  const courses = useMemo(() => {
    const courseMap = new Map();
    tournaments.forEach((t) => {
      if (t.course && !courseMap.has(t.course.id)) {
        courseMap.set(t.course.id, t.course);
      }
    });
    return Array.from(courseMap.values());
  }, [tournaments]);

  // Group tournaments by tier or date
  const groupedTournaments = useMemo(() => {
    if (leaderboardToggle === "Tier") {
      const tierGroups = new Map<string, TournamentWithIncludes[]>();
      tournaments.forEach((tournament) => {
        const tierId = tournament.tierId;
        if (!tierGroups.has(tierId)) {
          tierGroups.set(tierId, []);
        }
        tierGroups.get(tierId)!.push(tournament);
      });
      return Array.from(tierGroups.values());
    } else {
      // Group by date - simplified for now
      return [tournaments];
    }
  }, [tournaments, leaderboardToggle]);

  // Utility functions
  const getTierName = (
    tierName: string | undefined,
    groupIndex: number,
    isLive: boolean,
  ) => {
    return tierName || `Group ${groupIndex + 1}`;
  };

  const getTournamentHref = (
    tournamentId: string,
    viewMode: string,
    groupIndex: number,
    hasLiveTournament: boolean,
  ) => {
    return `/tournament/${tournamentId}`;
  };

  return {
    course,
    tier,
    courseData,
    courseDataLoading,
    groupedTournaments,
    dropdownTiers: tiers,
    dropdownCourses: courses,
    leaderboardToggle,
    onToggleChange: setLeaderboardToggle,
    getTierName,
    getTournamentHref,
  };
}
