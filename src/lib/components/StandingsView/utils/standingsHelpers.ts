import type { TourCard, Tour } from "@prisma/client";

/**
 * Returns all tour cards for a given tour with position <= 15 (including ties at 15).
 */
export function getGoldCutCards(
  tour: Tour & { tourCards?: TourCard[] },
): (TourCard & { points?: number; position?: string | number })[] {
  const cards = getTourCardsForTour(tour);
  return cards.filter((card) => parsePosition(card.position) <= 15);
}

/**
 * Returns all tour cards for a given tour with 16 <= position <= 35 (including ties).
 */
export function getSilverCutCards(
  tour: Tour & { tourCards?: TourCard[] },
): (TourCard & { points?: number; position?: string | number })[] {
  const cards = getTourCardsForTour(tour);
  return cards.filter((card) => {
    const pos = parsePosition(card.position);
    return pos >= 16 && pos <= 35;
  });
}

/**
 * Returns all tour cards for a given tour with position > 35.
 */
export function getRemainingCards(
  tour: Tour & { tourCards?: TourCard[] },
): (TourCard & { points?: number; position?: string | number })[] {
  const cards = getTourCardsForTour(tour);
  return cards.filter((card) => parsePosition(card.position) > 35);
}

/**
 * Helper to get all tour cards for a tour, sorted by points descending.
 * Assumes tourCards are attached to the tour, or can be filtered from global state.
 */
export function getTourCardsForTour(
  tour: Tour & { tourCards?: TourCard[] },
): (TourCard & { points?: number; position?: string | number })[] {
  let cards: (TourCard & { points?: number; position?: string | number })[] =
    [];
  if (tour.tourCards) {
    cards = tour.tourCards as (TourCard & {
      points?: number;
      position?: string | number;
    })[];
  } else if (
    typeof window !== "undefined" &&
    (window as Window & { allTourCards?: TourCard[] }).allTourCards
  ) {
    cards = (
      (window as Window & { allTourCards?: TourCard[] }).allTourCards ?? []
    )
      .map((a) => {
        return {
          ...a,
          points: a.points ?? 0,
          position: a.position ?? undefined,
        } as TourCard & { points?: number; position?: string | number };
      })
      .filter((tc) => tc.tourId === tour.id);
  }
  return cards.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
}

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
