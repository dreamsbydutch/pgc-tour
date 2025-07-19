/**
 * Pure utility functions for LeaderboardView component
 * These functions are reusable and have no side effects
 */

import type { ReactElement } from "react";
import { sortMultiple, filterItems } from "@pgc-utils";
import type {
  LeaderboardGolfer,
  LeaderboardTeam,
  TeamWithTourCard,
  LeaderboardTour,
  LeaderboardTourCard,
} from "./types";
import {
  SCORE_PENALTIES,
  PLAYOFF_CONFIGS,
  COUNTRY_FLAG_DATA,
} from "./constants";

// ================= FORMATTING & DISPLAY =================

/**
 * Gets the country flag component for a given country code
 * @param code - Country code (e.g., "USA", "CAN")
 * @returns React element for the country flag or undefined if not found
 */
export const getCountryFlag = (code: string | null): ReactElement | undefined =>
  COUNTRY_FLAG_DATA.find((item) => item.key === code)?.image();

/**
 * Calculates a numeric score for sorting purposes, handling special penalties
 * @param position - Position string (may include "DQ", "WD", "CUT")
 * @param score - Numeric score
 * @returns Numeric value for sorting
 */
export const calculateScoreForSorting = (
  position: string | null,
  score: number | null,
): number => {
  if (position === "DQ") return SCORE_PENALTIES.DQ + (score ?? 999);
  if (position === "WD") return SCORE_PENALTIES.WD + (score ?? 999);
  if (position === "CUT") return SCORE_PENALTIES.CUT + (score ?? 999);
  return score ?? 999;
};

/**
 * Calculates position change for display
 * @param team - Team with position data
 * @param golfer - Golfer with position change data
 * @param type - Whether this is PGC or PGA data
 * @returns Numeric position change
 */
export const getPositionChange = (
  team: { pastPosition: string | null; position: string | null } | undefined,
  golfer: { posChange: number | null } | undefined,
  type: "PGC" | "PGA",
): number => {
  if (type === "PGA") return golfer?.posChange ?? 0;
  if (!team?.pastPosition || !team?.position) return 0;
  return +team.pastPosition.replace("T", "") - +team.position.replace("T", "");
};

/**
 * Checks if a player has been cut from the tournament
 * @param position - Position string
 * @returns True if player was cut, DQ'd, or withdrew
 */
export const isPlayerCut = (position: string | null): boolean =>
  ["CUT", "WD", "DQ"].includes(position ?? "");

/**
 * Formats round scores for display
 * @param golfer - Golfer with round scores
 * @returns Formatted string of round scores
 */
export const formatRounds = (golfer: {
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
}): string =>
  [golfer.roundOne, golfer.roundTwo, golfer.roundThree, golfer.roundFour]
    .filter(Boolean)
    .join(" / ");

/**
 * Formats percentage values for display
 * @param value - Decimal percentage value
 * @returns Formatted percentage string
 */
export const formatPercentageDisplay = (value: number | null): string =>
  value ? `${Math.round(value * 1000) / 10}%` : "-";

/**
 * Formats a score for display with appropriate styling classes
 * @param score - Raw score number
 * @param par - Course par (optional)
 * @returns Formatted score object with display value and classes
 */
export const formatScore = (
  score: number | null,
  par?: number | null,
): { value: string; className: string } => {
  if (score === null) {
    return { value: "E", className: "text-gray-500" };
  }

  if (score === SCORE_PENALTIES.DQ) {
    return { value: "DQ", className: "text-red-600 font-semibold" };
  }

  if (score === SCORE_PENALTIES.WD) {
    return { value: "WD", className: "text-red-600 font-semibold" };
  }

  if (score === SCORE_PENALTIES.CUT) {
    return { value: "CUT", className: "text-red-600 font-semibold" };
  }

  if (!par) {
    return { value: score.toString(), className: "text-gray-900" };
  }

  const toPar = score - par;

  if (toPar === 0) {
    return { value: "E", className: "text-gray-900" };
  } else if (toPar > 0) {
    return {
      value: `+${toPar}`,
      className: "text-red-600",
    };
  } else {
    return {
      value: toPar.toString(),
      className: "text-green-600",
    };
  }
};

// ================= SORTING =================

/**
 * Sorts teams based on score, with special handling for penalties
 * @param teams - Array of teams to sort
 * @returns Sorted array of teams
 */
export const sortTeams = (
  teams: {
    thru: number | null;
    position: string | null;
    score: number | null;
  }[],
) =>
  teams
    .sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
    .sort(
      (a, b) =>
        calculateScoreForSorting(a.position, a.score) -
        calculateScoreForSorting(b.position, b.score),
    );

/**
 * Sorts golfers based on position and score with cut handling
 * @param golfers - Array of golfers to sort
 * @returns Sorted array of golfers
 */
export const sortGolfers = (
  golfers: {
    id?: number;
    position: string;
    score: number;
    group: number | null;
  }[],
) => {
  // Separate cut and non-cut golfers
  const nonCutGolfers = golfers.filter((g) => !isPlayerCut(g.position));
  const cutGolfers = golfers.filter((g) => isPlayerCut(g.position));

  // Sort non-cut golfers by score
  nonCutGolfers.sort(
    (a, b) =>
      calculateScoreForSorting(a.position, a.score) -
      calculateScoreForSorting(b.position, b.score),
  );

  // Sort cut golfers by group
  cutGolfers
    .sort(
      (a, b) =>
        calculateScoreForSorting(a.position, a.score) -
        calculateScoreForSorting(b.position, b.score),
    )
    .sort((a, b) => (a.group ?? 999) - (b.group ?? 999))
    .sort((a, b) => a.position.localeCompare(b.position));

  // Concatenate non-cut golfers first, then cut golfers
  return [...nonCutGolfers, ...cutGolfers];
};

/**
 * Gets sorted team golfers for a specific team
 * @param team - Team with golfer IDs
 * @param teamGolfers - Array of all golfers
 * @returns Sorted array of team's golfers
 */
export const getSortedTeamGolfers = (
  team: { golferIds: number[] },
  teamGolfers: {
    id: number;
    apiId: number;
    today: number | null;
    thru: number | null;
    score: number | null;
    group: number | null;
  }[] = [],
) =>
  sortMultiple(
    filterItems(teamGolfers, { apiId: team.golferIds }),
    ["today", "thru", "score", "group"],
    ["asc", "asc", "asc", "asc"],
  );

// ================= FILTERING =================

/**
 * Filters teams based on tour and variant
 * @param teams - Array of teams to filter
 * @param activeTour - Currently selected tour ID
 * @param variant - Leaderboard variant (regular/playoff)
 * @returns Filtered array of teams
 */
export const filterTeamsByTour = (
  teams: TeamWithTourCard[],
  activeTour: string,
  variant: "regular" | "playoff",
): TeamWithTourCard[] => {
  const sortedTeams = sortTeams(teams) as TeamWithTourCard[];

  if (variant === "playoff") {
    const playoffLevel =
      activeTour === "gold" ? 1 : activeTour === "silver" ? 2 : 1;
    return sortedTeams.filter(
      (team) => team.tourCard?.playoff === playoffLevel,
    );
  }

  return sortedTeams.filter((team) => team.tourCard?.tourId === activeTour);
};

// ================= TOUR LOGIC =================

/**
 * Determines the available tour toggles based on variant and data
 * @param variant - Leaderboard variant
 * @param tours - Available tours
 * @param tourCards - Available tour cards
 * @returns Array of toggle tours
 */
export const getToggleTours = (
  variant: "regular" | "playoff",
  tours: LeaderboardTour[],
  tourCards: LeaderboardTourCard[],
): LeaderboardTour[] => {
  if (variant === "playoff") {
    const maxPlayoff = Math.max(
      ...(tourCards?.map((card) => card.playoff ?? 0) ?? []),
    );
    return maxPlayoff > 1
      ? [PLAYOFF_CONFIGS.gold, PLAYOFF_CONFIGS.silver, PLAYOFF_CONFIGS.pga]
      : [PLAYOFF_CONFIGS.solo, PLAYOFF_CONFIGS.pga];
  }

  return [...tours, PLAYOFF_CONFIGS.pga];
};

/**
 * Determines the default tour toggle based on variant and input
 * @param variant - Leaderboard variant
 * @param inputTourId - Input tour ID from props/URL
 * @param toggleTours - Available toggle tours
 * @returns Default tour ID
 */
export const getDefaultToggle = (
  variant: "regular" | "playoff",
  inputTourId?: string,
  toggleTours: LeaderboardTour[] = [],
): string => {
  if (variant === "playoff") return "gold";
  if (inputTourId) return inputTourId;
  return toggleTours[0]?.id ?? "";
};

// ================= STYLING =================

/**
 * Gets CSS classes for golfer rows based on tournament state
 * @param team - Team data
 * @param golfer - Golfer data
 * @param i - Row index
 * @returns CSS class string
 */
export const getGolferRowClass = (
  team: { round: number | null },
  golfer: { position: string | null },
  i: number,
): string => {
  const classes = [];

  if ((team.round ?? 0) >= 3 && i === 4)
    classes.push("border-b border-gray-700");
  if (i === 9) classes.push("border-b border-gray-700");
  if (isPlayerCut(golfer.position)) classes.push("text-gray-400");

  return classes.join(" ");
};

/**
 * Gets CSS classes for leaderboard rows based on user context
 * @param type - PGC or PGA leaderboard type
 * @param team - Team data
 * @param golfer - Golfer data
 * @param tourCard - Tour card data
 * @param userTourCard - User's tour card
 * @param member - Member data with friends
 * @returns CSS class string
 */
export const getLeaderboardRowClass = (
  type: "PGC" | "PGA",
  team: { position: string | null; golferIds: number[] } | undefined,
  golfer: { apiId: number; position: string | null } | undefined,
  tourCard: { id: string; memberId: string } | null | undefined,
  userTourCard: { id: string } | null | undefined,
  member: { friends: string[] | null } | null | undefined,
): string => {
  const classes = [
    "col-span-10 grid grid-flow-row grid-cols-10 py-0.5 sm:grid-cols-33",
  ];

  if (type === "PGC") {
    if (tourCard?.id === userTourCard?.id)
      classes.push("bg-slate-200 font-semibold");
    if (member?.friends?.includes(tourCard?.memberId ?? ""))
      classes.push("bg-slate-100");
    if (team?.position === "CUT") classes.push("text-gray-400");
  }

  if (type === "PGA") {
    if (team?.golferIds?.includes(golfer?.apiId ?? 0))
      classes.push("bg-slate-100");
    if (isPlayerCut(golfer?.position ?? null)) classes.push("text-gray-400");
  }

  return classes.join(" ");
};

/**
 * Gets the golfer names for a team
 * @param team - Team object
 * @param golfers - Array of all golfers
 * @returns Array of golfer names
 */
export const getTeamGolferNames = (
  team: TeamWithTourCard,
  golfers: LeaderboardGolfer[],
): string[] => {
  return (
    (team.golferIds
      ?.map((id) => golfers.find((g) => g.id === id)?.playerName)
      ?.filter(Boolean) as string[]) ?? []
  );
};
