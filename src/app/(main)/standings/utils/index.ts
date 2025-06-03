import type { Tour, TourCard } from "@prisma/client";

/**
 * Filters tour cards by tour ID
 */
export const filterTourCardsByTour = (
  tourCards: TourCard[] | null,
  tourId: string | undefined,
): TourCard[] => {
  if (!tourCards || !tourId) return [];
  return tourCards.filter((obj) => obj.tourId === tourId);
};

/**
 * Sorts tour cards by points in descending order
 */
export const sortTourCardsByPoints = (tourCards: TourCard[]): TourCard[] => {
  return [...tourCards].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
};

/**
 * Filters tour cards by playoff position range
 */
export const filterByPlayoffRange = (
  tourCards: TourCard[],
  minPosition: number,
  maxPosition: number,
): TourCard[] => {
  return tourCards.filter((obj) => {
    const position = +(obj.position?.replace("T", "") ?? 0);
    return position >= minPosition && position <= maxPosition;
  });
};

/**
 * Gets tour cards that qualify for gold playoffs
 */
export const getGoldPlayoffTeams = (
  tours: Tour[] | null,
  tourCards: TourCard[] | null,
): TourCard[] => {
  if (!tours || !tourCards) return [];

  return tours
    .map((tour) =>
      tourCards.filter(
        (obj) =>
          obj.tourId === tour.id &&
          +(obj.position?.replace("T", "") ?? 100) <=
            (tour.playoffSpots[0] ?? 15),
      ),
    )
    .flat();
};

/**
 * Gets tour cards that qualify for silver playoffs
 */
export const getSilverPlayoffTeams = (
  tours: Tour[] | null,
  tourCards: TourCard[] | null,
): TourCard[] => {
  if (!tours || !tourCards) return [];

  return tours
    .map((tour) =>
      tourCards.filter(
        (obj) =>
          obj.tourId === tour.id &&
          +(obj.position?.replace("T", "") ?? 100) >
            (tour.playoffSpots[0] ?? 15) &&
          +(obj.position?.replace("T", "") ?? 100) <=
            (tour.playoffSpots[0] ?? 15) + (tour.playoffSpots[1] ?? 15),
      ),
    )
    .flat();
};

/**
 * Creates a mock playoffs tour object
 */
export const createPlayoffsTour = (seasonId: string): Tour => ({
  name: "Playoffs",
  shortForm: "Playoffs",
  seasonId,
  id: "playoffs",
  buyIn: 0,
  playoffSpots: [30, 40],
  logoUrl:
    "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
  updatedAt: new Date(),
  createdAt: new Date(),
});

/**
 * Creates a mock tier object for playoffs
 */
export const createMockTier = (
  id: string,
  name: string,
  payouts: number[],
  points: number[],
) => ({
  id,
  name,
  payouts,
  points,
  seasonId: "",
  updatedAt: new Date(),
  createdAt: new Date(),
});

/**
 * Gets the initial standings toggle value from search params or tour card
 */
export const getInitialStandingsToggle = (
  searchParams: Record<string, string>,
  tourCard: TourCard | null | undefined,
  tours: Tour[] | null,
): string => {
  const inputTourId = searchParams.tour ?? tourCard?.tourId ?? "";

  if (inputTourId && inputTourId !== "") {
    return inputTourId;
  }

  return tourCard?.tourId ?? tours?.[0]?.id ?? "";
};
