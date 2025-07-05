/**
 * @fileoverview Sorting utilities for golf tournaments and data
 * Provides comprehensive sorting functions for golfers, tournaments, and general data
 */

import type { Golfer, Team } from "@prisma/client";

/**
 * Sorts golfers by position and score with comprehensive handling for all tournament scenarios
 * @param golfers - Array of golfer objects
 * @param round - Optional round number (1, 2, 3, 4) to sort by specific round score
 * @param isLiveRound - Whether the specified round is currently live (affects scoring logic)
 * @returns Sorted array of golfers
 * @example
 * sortGolfers(golfers) // Sort by overall position and score
 * sortGolfers(golfers, 2) // Sort by round 2 score
 * sortGolfers(golfers, 4, true) // Sort by live round 4 score
 */
export function sortGolfers(
  golfers: Golfer[],
  round?: number,
  isLiveRound?: boolean,
): Golfer[] {
  return golfers.sort((a, b) => {
    // Helper function to parse position strings
    const parsePosition = (position: string | null): number => {
      if (!position) return 999;

      // Handle special positions
      if (position === "CUT") return 1000;
      if (position === "WD") return 1001;
      if (position === "DQ") return 1002;

      // Handle tied positions (T5, T10, etc.)
      if (position.startsWith("T")) {
        const num = parseInt(position.substring(1));
        return isNaN(num) ? 999 : num;
      }

      // Handle regular numeric positions
      const num = parseInt(position);
      return isNaN(num) ? 999 : num;
    };

    // Helper function to get score for comparison
    const getScoreForRound = (golfer: Golfer): number => {
      if (!round) {
        // No specific round - use total score
        return golfer.score ?? 999;
      }

      // Get specific round score
      let roundScore: number | null = null;
      switch (round) {
        case 1:
          roundScore = golfer.roundOne;
          break;
        case 2:
          roundScore = golfer.roundTwo;
          break;
        case 3:
          roundScore = golfer.roundThree;
          break;
        case 4:
          roundScore = golfer.roundFour;
          break;
        default:
          roundScore = golfer.score;
      }

      // For live rounds, use today's score if available, otherwise round score
      if (isLiveRound && round) {
        return golfer.today ?? roundScore ?? 999;
      }

      return roundScore ?? 999;
    };

    const aPosition = parsePosition(a.position);
    const bPosition = parsePosition(b.position);

    // Primary sort: by position
    if (aPosition !== bPosition) {
      return aPosition - bPosition;
    }

    // Secondary sort: by score (for players in same position category)
    const aScore = getScoreForRound(a);
    const bScore = getScoreForRound(b);

    // For cut/withdrawn/disqualified players, still sort by score but they're already grouped together
    if (aPosition >= 1000) {
      // Within CUT/WD/DQ groups, sort by score
      if (aScore !== bScore) {
        return aScore - bScore;
      }
      // If scores are equal, maintain stable sort by name
      return (a.playerName ?? "").localeCompare(b.playerName ?? "");
    }

    // For regular players, sort by score
    if (aScore !== bScore) {
      return aScore - bScore;
    }

    // Tertiary sort: by player name for stable sorting
    return (a.playerName ?? "").localeCompare(b.playerName ?? "");
  });
}

/**
 * Sorts teams by their performance metrics
 * @param teams - Array of team objects
 * @param sortBy - Field to sort by ('score' | 'earnings' | 'points')
 * @param direction - Sort direction ('asc' | 'desc')
 * @returns Sorted array of teams
 * @example
 * sortTeams(teams, 'score', 'asc') // Sort by score ascending
 * sortTeams(teams, 'earnings', 'desc') // Sort by earnings descending
 */
export function sortTeams(
  teams: Team[],
  sortBy: "score" | "earnings" | "points" = "score",
  direction: "asc" | "desc" = "asc",
): Team[] {
  return teams.sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case "earnings":
        aValue = a.earnings ?? 0;
        bValue = b.earnings ?? 0;
        break;
      case "points":
        aValue = a.points ?? 0;
        bValue = b.points ?? 0;
        break;
      case "score":
      default:
        aValue = a.score ?? 999;
        bValue = b.score ?? 999;
        break;
    }

    const comparison = aValue - bValue;
    return direction === "desc" ? -comparison : comparison;
  });
}

/**
 * Sorts dates in ascending or descending order
 * @param a - First date
 * @param b - Second date
 * @param direction - Sort direction ('asc' | 'desc')
 * @returns Comparison result for sorting
 * @example
 * dates.sort((a, b) => sortByDate(a, b, 'desc'))
 */
export function sortByDate(
  a: Date,
  b: Date,
  direction: "asc" | "desc" = "asc",
): number {
  const comparison = new Date(a).getTime() - new Date(b).getTime();
  return direction === "desc" ? -comparison : comparison;
}

/**
 * Sorts by position strings (handles "T", ordinal suffixes)
 * @param a - First position string
 * @param b - Second position string
 * @returns Comparison result for sorting
 * @example
 * positions.sort(sortByPosition) // ["1st", "T2", "3rd", "T10"]
 */
export function sortByPosition(a: string, b: string): number {
  const cleanPosition = (pos: string): number => {
    return parseInt(
      pos
        .replace("T", "")
        .replace("st", "")
        .replace("nd", "")
        .replace("rd", "")
        .replace("th", ""),
    );
  };

  return cleanPosition(a) - cleanPosition(b);
}

/**
 * Sorts by numeric score values
 * @param a - First score
 * @param b - Second score
 * @returns Comparison result for sorting
 * @example
 * scores.sort(sortByScore) // [-2, 0, 3, 5]
 */
export function sortByScore(a: string | number, b: string | number): number {
  return Number(a) - Number(b);
}

/**
 * Generic number sorting function
 * @param a - First number
 * @param b - Second number
 * @param direction - Sort direction ('asc' | 'desc')
 * @returns Comparison result for sorting
 * @example
 * numbers.sort((a, b) => sortByNumber(a, b, 'desc'))
 */
export function sortByNumber(
  a: number,
  b: number,
  direction: "asc" | "desc" = "asc",
): number {
  const comparison = a - b;
  return direction === "desc" ? -comparison : comparison;
}

/**
 * Sorts alphabetically with optional case sensitivity
 * @param a - First string
 * @param b - Second string
 * @param caseSensitive - Whether to sort case-sensitively
 * @param direction - Sort direction ('asc' | 'desc')
 * @returns Comparison result for sorting
 * @example
 * strings.sort((a, b) => sortAlphabetically(a, b))
 */
export function sortAlphabetically(
  a: string,
  b: string,
  caseSensitive = false,
  direction: "asc" | "desc" = "asc",
): number {
  const strA = caseSensitive ? a : a.toLowerCase();
  const strB = caseSensitive ? b : b.toLowerCase();

  const comparison = strA.localeCompare(strB);
  return direction === "desc" ? -comparison : comparison;
}

/**
 * Sorts by multiple fields with different directions
 * @param items - Array of objects to sort
 * @param sortFields - Array of field configurations
 * @returns Sorted array
 * @example
 * sortMultiple(players, [
 *   { field: 'score', direction: 'asc' },
 *   { field: 'name', direction: 'asc' }
 * ])
 */
export function sortMultiple<T extends Record<string, any>>(
  items: T[],
  sortFields: Array<{
    field: keyof T;
    direction: "asc" | "desc";
    type?: "string" | "number" | "date";
  }>,
): T[] {
  return items.sort((a, b) => {
    for (const { field, direction, type = "string" } of sortFields) {
      let comparison = 0;

      const aVal = a[field];
      const bVal = b[field];

      switch (type) {
        case "number":
          comparison = Number(aVal) - Number(bVal);
          break;
        case "date":
          comparison = new Date(aVal).getTime() - new Date(bVal).getTime();
          break;
        case "string":
        default:
          comparison = String(aVal).localeCompare(String(bVal));
          break;
      }

      if (comparison !== 0) {
        return direction === "desc" ? -comparison : comparison;
      }
    }
    return 0;
  });
}

/**
 * Shuffles an array randomly using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns New shuffled array
 * @example
 * shuffle([1, 2, 3, 4, 5]) // [3, 1, 5, 2, 4]
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp!;
  }
  return shuffled;
}
