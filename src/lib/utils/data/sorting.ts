// Golf-specific and advanced sorting algorithms
// Extracted from old-utils/sorting.ts - only complex, high-value sorting logic

import type { Golfer, Team } from "@prisma/client";

/**
 * Advanced sorting algorithms for golf tournaments and data processing
 * Focuses on complex golf business logic and multi-field sorting capabilities
 */

export function sortGolfers(
  golfers: Golfer[],
  round?: number,
  isLiveRound?: boolean,
): Golfer[] {
  return golfers.sort((a, b) => {
    const parsePosition = (position: string | null): number => {
      if (!position) return 999;

      if (position === "CUT") return 1000;
      if (position === "WD") return 1001;
      if (position === "DQ") return 1002;

      if (position.startsWith("T")) {
        const num = parseInt(position.substring(1));
        return isNaN(num) ? 999 : num;
      }

      const num = parseInt(position);
      return isNaN(num) ? 999 : num;
    };

    const getScoreForRound = (golfer: Golfer): number => {
      if (!round) {
        return golfer.score ?? 999;
      }

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

      if (isLiveRound && round) {
        return golfer.today ?? roundScore ?? 999;
      }

      return roundScore ?? 999;
    };

    const aPosition = parsePosition(a.position);
    const bPosition = parsePosition(b.position);

    if (aPosition !== bPosition) {
      return aPosition - bPosition;
    }

    const aScore = getScoreForRound(a);
    const bScore = getScoreForRound(b);

    if (aPosition >= 1000) {
      if (aScore !== bScore) {
        return aScore - bScore;
      }
      return (a.playerName ?? "").localeCompare(b.playerName ?? "");
    }

    if (aScore !== bScore) {
      return aScore - bScore;
    }

    return (a.playerName ?? "").localeCompare(b.playerName ?? "");
  });
}

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

export function sortByDate(
  a: Date,
  b: Date,
  direction: "asc" | "desc" = "asc",
): number {
  const comparison = new Date(a).getTime() - new Date(b).getTime();
  return direction === "desc" ? -comparison : comparison;
}

export function sortByNumber(
  a: number,
  b: number,
  direction: "asc" | "desc" = "asc",
): number {
  const comparison = a - b;
  return direction === "desc" ? -comparison : comparison;
}

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
