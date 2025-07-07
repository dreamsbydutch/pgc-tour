/**
 * @fileoverview Seasonal Store React Hooks
 * Provides efficient, reusable hooks for accessing and manipulating seasonal data.
 * All hooks are documented for IntelliSense and code completion.
 */

import { useSeasonalStore } from "./seasonalStore";
import type {
  TournamentFilters,
  TourCardFilters,
  SortDirection,
  MinimalTourCard,
  MinimalTournament,
  MinimalTour,
  MinimalTier,
  MinimalCourse,
} from "./seasonalStore";

// ============= BASIC DATA HOOKS =============

/**
 * Returns all core seasonal data objects from the store.
 * @returns An object containing season, member, tourCard, tournaments, tourCards, tours, and tiers.
 */
export const useSeasonalData = () =>
  useSeasonalStore((state) => ({
    season: state.season,
    member: state.member,
    tourCard: state.tourCard,
    tournaments: state.tournaments,
    tourCards: state.allTourCards,
    tours: state.tours,
    tiers: state.tiers,
  }));

/**
 * Returns all core seasonal store actions for updating data.
 * @returns An object with all mutation functions for the store.
 */
export const useSeasonalActions = () =>
  useSeasonalStore((state) => ({
    setSeasonalData: state.setSeasonalData,
    reset: state.reset,
    updateMember: state.updateMember,
    clearAndSet: state.clearAndSet,
    updateItem: state.updateItem,
    addItem: state.addItem,
    removeItem: state.removeItem,
    batchUpdate: state.batchUpdate,
  }));

// ============= FILTERED DATA HOOKS =============

/**
 * Returns tournaments filtered and sorted by the given criteria.
 * @param filters Optional filter object for tournaments.
 * @param sortBy Optional key to sort tournaments by.
 * @param direction Optional sort direction ("asc" or "desc").
 * @returns Array of tournaments matching the criteria.
 */
export function useTournaments(
  filters?: TournamentFilters,
  sortBy?: keyof MinimalTournament,
  direction?: SortDirection,
) {
  return useSeasonalStore((state) => state.getTournaments(filters, sortBy, direction));
}

/**
 * Returns tour cards filtered and sorted by the given criteria.
 * @param filters Optional filter object for tour cards.
 * @param sortBy Optional key to sort tour cards by.
 * @param direction Optional sort direction ("asc" or "desc").
 * @returns Array of tour cards matching the criteria.
 */
export function useTourCards(
  filters?: TourCardFilters,
  sortBy?: keyof MinimalTourCard,
  direction?: SortDirection,
) {
  return useSeasonalStore((state) => state.getTourCards(filters, sortBy, direction));
}

/**
 * Returns tours sorted by the given criteria.
 * @param sortBy Optional key to sort tours by.
 * @param direction Optional sort direction ("asc" or "desc").
 * @returns Array of tours.
 */
export function useTours(
  sortBy?: keyof MinimalTour,
  direction?: SortDirection,
) {
  return useSeasonalStore((state) => state.getTours(sortBy, direction));
}

/**
 * Returns tiers sorted by the given criteria.
 * @param sortBy Optional key to sort tiers by.
 * @param direction Optional sort direction ("asc" or "desc").
 * @returns Array of tiers.
 */
export function useTiers(
  sortBy?: keyof MinimalTier,
  direction?: SortDirection,
) {
  return useSeasonalStore((state) => state.getTiers(sortBy, direction));
}

/**
 * Returns courses filtered by location (if provided).
 * @param location Optional location string to filter courses.
 * @returns Array of courses.
 */
export function useCourses(location?: string) {
  return useSeasonalStore((state) => state.getCourses(location));
}

// ============= CONVENIENCE HOOKS =============

/**
 * Returns the current tournament (status: "current") or undefined.
 * @returns The current tournament or undefined if not found.
 */
export function useCurrentTournament() {
  return useTournaments({ status: ["current"] })[0];
}

/**
 * Returns all upcoming tournaments, sorted by start date ascending.
 * @returns Array of upcoming tournaments.
 */
export function useUpcomingTournaments() {
  return useTournaments({ status: ["upcoming"] }, "startDate", "asc");
}

/**
 * Returns all past tournaments, sorted by end date descending.
 * @returns Array of completed tournaments.
 */
export function usePastTournaments() {
  return useTournaments({ status: ["completed"] }, "endDate", "desc");
}

/**
 * Returns all tour cards sorted by points descending (leaderboard).
 * @returns Array of tour cards sorted by points.
 */
export function useLeaderboard() {
  return useTourCards(undefined, "points", "desc");
}

/**
 * Returns the top N earners (default 10) from tour cards.
 * @param limit Number of top earners to return (default 10).
 * @returns Array of top earning tour cards.
 */
export function useTopEarners(limit = 10) {
  return useTourCards(undefined, "earnings", "desc").slice(0, limit);
}

/**
 * Returns all active tour cards (with earnings or points).
 * @returns Array of active tour cards.
 */
export function useActiveTourCards() {
  return useTourCards({ hasEarnings: true });
}

/**
 * Returns all tour cards for a given tour, sorted by earnings descending.
 * @param tourId The tour id to filter by.
 * @returns Array of tour cards for the tour.
 */
export function useTourCardsByTour(tourId: string) {
  return useTourCards({ tourIds: [tourId] }, "earnings", "desc");
}

/**
 * Returns all tournaments for a given tier, sorted by start date ascending.
 * @param tierId The tier id to filter by.
 * @returns Array of tournaments for the tier.
 */
export function useTournamentsByTier(tierId: string) {
  return useTournaments({ tierIds: [tierId] }, "startDate", "asc");
}

/**
 * Returns the current member's tour card, or undefined if not found.
 * @returns The current member's tour card or undefined.
 */
export function useMyTourCard() {
  const member = useSeasonalStore((state) => state.member);
  const tourCards = useTourCards();
  return member ? tourCards.find((tc) => tc.memberId === member.id) : undefined;
}

// ============= SEARCH HOOKS =============

/**
 * Searches across seasonal data types for a query string.
 * @param query The search string.
 * @param types Types to search (tournaments, tourCards, tours, tiers).
 * @returns Array of search results.
 */
export function useSearch(
  query: string,
  types?: ("tournaments" | "tourCards" | "tours" | "tiers")[],
) {
  return useSeasonalStore((state) => state.search(query, types));
}

// ============= STATS HOOKS =============

/**
 * Returns all stats from the store.
 * @returns Stats object containing tournaments, tourCards, and tours stats.
 */
export function useStats() {
  return useSeasonalStore((state) => state.getStats());
}

/**
 * Returns tournament stats from the store.
 * @returns Tournament stats object.
 */
export function useTournamentStats() {
  return useStats().tournaments;
}

/**
 * Returns tour card stats from the store.
 * @returns Tour card stats object.
 */
export function useTourCardStats() {
  return useStats().tourCards;
}

/**
 * Returns tour stats from the store.
 * @returns Tour stats object.
 */
export function useTourStats() {
  return useStats().tours;
}

// ============= UTILITY HOOKS =============

/**
 * Returns data freshness info (isStale, age, lastLoaded).
 * @returns Object with isStale, age, and lastLoaded properties.
 */
export function useDataFreshness() {
  return useSeasonalStore((state) => ({
    isStale: state.isDataStale(),
    age: state.getDataAge(),
    lastLoaded: state.lastLoaded,
  }));
}

/**
 * Returns the result of seasonal data validation.
 * @returns Validation result object or boolean.
 */
export function useDataValidation() {
  return useSeasonalStore((state) => state.validateData());
}

// ============= DERIVED HOOKS =============

/**
 * Returns tournaments grouped by status (current, upcoming, past).
 * @returns Object with arrays for current, upcoming, and past tournaments.
 */
export function useTournamentsByStatus() {
  const current = useCurrentTournament();
  const upcoming = useUpcomingTournaments();
  const past = usePastTournaments();
  return {
    current: current ? [current] : [],
    upcoming,
    past,
  };
}

/**
 * Returns the earnings distribution from tour card stats.
 * @returns Earnings distribution object or array.
 */
export function useEarningsDistribution() {
  const stats = useTourCardStats();
  return stats.earnings;
}

/**
 * Returns tournament count by tier from tournament stats.
 * @returns Object mapping tier ids to tournament counts.
 */
export function useTournamentCountByTier() {
  const stats = useTournamentStats();
  return stats.byTier;
}

/**
 * Returns member count by tour from tour card stats.
 * @returns Object mapping tour ids to member counts.
 */
export function useMemberCountByTour() {
  const stats = useTourCardStats();
  return stats.byTour;
}

// ============= INDIVIDUAL ITEM HOOKS =============

/**
 * Returns a tournament by id, or undefined if not found.
 * @param id The tournament id.
 * @returns The tournament object or undefined.
 */
export function useTournament(id?: string) {
  const tournaments = useTournaments();
  return id ? tournaments.find((t) => t.id === id) : undefined;
}

/**
 * Returns a tour card by id, or undefined if not found.
 * @param id The tour card id.
 * @returns The tour card object or undefined.
 */
export function useTourCard(id?: string) {
  const tourCards = useTourCards();
  return id ? tourCards.find((tc) => tc.id === id) : undefined;
}

/**
 * Returns a tour by id, or undefined if not found.
 * @param id The tour id.
 * @returns The tour object or undefined.
 */
export function useTour(id?: string) {
  const tours = useTours();
  return id ? tours.find((t) => t.id === id) : undefined;
}

/**
 * Returns a tier by id, or undefined if not found.
 * @param id The tier id.
 * @returns The tier object or undefined.
 */
export function useTier(id?: string) {
  const tiers = useTiers();
  return id ? tiers.find((t) => t.id === id) : undefined;
}

/**
 * Returns a course by id, or undefined if not found.
 * @param id The course id.
 * @returns The course object or undefined.
 */
export function useCourse(id?: string) {
  const courses = useCourses();
  return id ? courses.find((c) => c.id === id) : undefined;
}

// ============= TYPE EXPORTS =============

export type {
  TournamentFilters,
  TourCardFilters,
  SortDirection,
  MinimalTournament,
  MinimalTourCard,
  MinimalTour,
  MinimalTier,
  MinimalCourse,
} from "./seasonalStore";
