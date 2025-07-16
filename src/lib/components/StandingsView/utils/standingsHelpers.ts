import type {
  ExtendedTourCard,
  StandingsGroups,
  PlayoffGroups,
} from "../types";

/**
 * Parses a position string/number (e.g., "T15", 12, "1") to a number for comparison.
 * Returns Infinity if not parseable.
 */
export function parsePosition(pos: string | number | undefined | null): number {
  if (typeof pos === "number") return pos;
  if (typeof pos === "string") {
    const match = /\d+/.exec(pos);
    if (match) return parseInt(match[0], 10);
  }
  return Infinity;
}

/**
 * Groups tour cards by their standings position for regular tour view
 */
export function groupTourStandings(
  tourCards: ExtendedTourCard[],
): StandingsGroups {
  const goldCutCards = tourCards.filter(
    (card) => parsePosition(card.position) <= 15,
  );

  const silverCutCards = tourCards.filter((card) => {
    const pos = parsePosition(card.position);
    return pos >= 16 && pos <= 35;
  });

  const remainingCards = tourCards.filter(
    (card) => parsePosition(card.position) > 35,
  );

  return {
    goldCutCards,
    silverCutCards,
    remainingCards,
  };
}

/**
 * Groups tour cards by their playoff standings
 */
export function groupPlayoffStandings(
  tourCards: ExtendedTourCard[],
): PlayoffGroups {
  const goldTeams = tourCards.filter(
    (card) => parsePosition(card.position) <= 15,
  );

  const silverTeams = tourCards.filter((card) => {
    const pos = parsePosition(card.position);
    return pos <= 35 && pos > 15;
  });

  const bumpedTeams = tourCards.filter((card) => {
    const pos = parsePosition(card.position);
    return pos > 35 && pos + (card.posChange ?? 0) <= 35;
  });

  return {
    goldTeams,
    silverTeams,
    bumpedTeams,
  };
}

/**
 * Sorts tour cards by points descending
 */
export function sortTourCardsByPoints(
  tourCards: ExtendedTourCard[],
): ExtendedTourCard[] {
  return [...tourCards].sort((a, b) => b.points - a.points);
}

/**
 * Filters tour cards for a specific tour
 */
export function filterTourCardsByTour(
  tourCards: ExtendedTourCard[],
  tourId: string,
): ExtendedTourCard[] {
  return tourCards.filter((card) => card.tourId === tourId);
}
