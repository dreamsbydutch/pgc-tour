/**
 * @fileoverview Convenient hooks for using the seasonal store
 * Provides pre-configured selectors and utilities for common store operations
 */

import {
  useSeasonalStore,
  type TournamentFilters,
  type TourCardFilters,
  type SortDirection,
  type TournamentStatus,
  type MinimalTourCard,
} from "./seasonalStore";

// ============= TOURNAMENT HOOKS =============

/**
 * Get current tournament
 */
export function useCurrentTournament() {
  return useSeasonalStore((state) => state.getCurrentTournament());
}

/**
 * Get upcoming tournaments
 */
export function useUpcomingTournaments() {
  return useSeasonalStore((state) => state.getUpcomingTournaments());
}

/**
 * Get past tournaments
 */
export function usePastTournaments() {
  return useSeasonalStore((state) => state.getPastTournaments());
}

/**
 * Get tournament by ID
 */
export function useTournament(id?: string) {
  return useSeasonalStore((state) =>
    id ? state.getTournament(id) : undefined,
  );
}

/**
 * Get tournament stats
 */
export function useTournamentStats() {
  return useSeasonalStore((state) => state.getTournamentStats());
}

// ============= TOUR CARD HOOKS =============

/**
 * Get current user's tour card
 */
export function useMyTourCard() {
  return useSeasonalStore((state) => {
    const memberId = state.member?.id;
    return memberId ? state.getTourCardByMember(memberId) : undefined;
  });
}

/**
 * Get leaderboard
 */
export function useLeaderboard() {
  return useSeasonalStore((state) => state.getLeaderboard());
}

/**
 * Get top earners
 */
export function useTopEarners(limit = 10) {
  return useSeasonalStore((state) => state.getTopEarners(limit));
}

/**
 * Get tour cards by tour
 */
export function useTourCardsByTour(tourId?: string) {
  return useSeasonalStore((state) =>
    tourId ? state.getTourCardsByTour(tourId) : [],
  );
}

/**
 * Get member stats
 */
export function useMemberStats() {
  return useSeasonalStore((state) => state.getMemberStats());
}

// ============= DATA MANAGEMENT HOOKS =============

/**
 * Check if data is stale
 */
export function useDataFreshness() {
  return useSeasonalStore((state) => ({
    isStale: state.isDataStale(),
    age: state.getDataAge(),
    lastLoaded: state.lastLoaded,
  }));
}

/**
 * Get all basic store data
 */
export function useSeasonalData() {
  return useSeasonalStore((state) => ({
    season: state.season,
    member: state.member,
    tourCard: state.tourCard,
    allTourCards: state.allTourCards,
    tournaments: state.tournaments,
    tiers: state.tiers,
    tours: state.tours,
  }));
}

/**
 * Get store actions
 */
export function useSeasonalActions() {
  return useSeasonalStore((state) => ({
    setSeasonalData: state.setSeasonalData,
    reset: state.reset,
    updateMember: state.updateMember,
    clearAndSet: state.clearAndSet,
    updateTournament: state.updateTournament,
    addTournament: state.addTournament,
    removeTournament: state.removeTournament,
    updateTour: state.updateTour,
    addTour: state.addTour,
    removeTour: state.removeTour,
    updateTourCard: state.updateTourCard,
    addTourCard: state.addTourCard,
    removeTourCard: state.removeTourCard,
    updateTier: state.updateTier,
    addTier: state.addTier,
    removeTier: state.removeTier,
  }));
}

// ============= SEARCH HOOKS =============

/**
 * Search tournaments
 */
export function useSearchTournaments(query: string) {
  return useSeasonalStore((state) =>
    query.trim() ? state.searchTournaments(query.trim()) : [],
  );
}

/**
 * Search tour cards
 */
export function useSearchTourCards(query: string) {
  return useSeasonalStore((state) =>
    query.trim() ? state.searchTourCards(query.trim()) : [],
  );
}

// ============= COMPUTED VALUE HOOKS =============

/**
 * Get tournaments grouped by status
 */
export function useTournamentsGroupedByStatus() {
  return useSeasonalStore((state) => {
    const current = state.getCurrentTournament();
    const upcoming = state.getUpcomingTournaments();
    const past = state.getPastTournaments();

    return {
      current: current ? [current] : [],
      upcoming,
      past,
    };
  });
}

/**
 * Get earnings leaders
 */
export function useEarningsLeaders(limit = 5) {
  return useSeasonalStore((state) => state.getTopEarners(limit));
}

/**
 * Get tour card by member ID
 */
export function useTourCardByMember(memberId?: string) {
  return useSeasonalStore((state) =>
    memberId ? state.getTourCardByMember(memberId) : undefined,
  );
}

/**
 * Get tournament by tier
 */
export function useTournamentsByTier(tierId?: string) {
  return useSeasonalStore((state) =>
    tierId ? state.getTournamentsByTier(tierId) : [],
  );
}

/**
 * Get multiple tours by IDs
 */
export function useToursByIds(ids: string[]) {
  return useSeasonalStore((state) => state.getToursById(ids));
}

/**
 * Get tier by ID
 */
export function useTier(id?: string) {
  return useSeasonalStore((state) => (id ? state.getTier(id) : undefined));
}

/**
 * Get tour by ID
 */
export function useTour(id?: string) {
  return useSeasonalStore((state) => (id ? state.getTour(id) : undefined));
}

// ============= ADVANCED FILTERING AND MANIPULATION HOOKS =============

/**
 * Filter tournaments with advanced criteria
 */
export function useFilteredTournaments(filters: TournamentFilters) {
  return useSeasonalStore((state) => state.filterTournaments(filters));
}

/**
 * Filter tour cards with advanced criteria
 */
export function useFilteredTourCards(filters: TourCardFilters) {
  return useSeasonalStore((state) => state.filterTourCards(filters));
}

/**
 * Get sorted tour cards
 */
export function useSortedTourCards(
  key: keyof MinimalTourCard,
  direction: SortDirection = "desc",
) {
  return useSeasonalStore((state) => state.sortTourCards(key, direction));
}

/**
 * Get tour cards by earnings range
 */
export function useTourCardsByEarningsRange(min: number, max: number) {
  return useSeasonalStore((state) =>
    state.getTourCardsByEarningsRange(min, max),
  );
}

/**
 * Get active tour cards (with earnings or points)
 */
export function useActiveTourCards() {
  return useSeasonalStore((state) => state.getActiveTourCards());
}

/**
 * Get inactive tour cards (no earnings or points)
 */
export function useInactiveTourCards() {
  return useSeasonalStore((state) => state.getInactiveTourCards());
}

// ============= COURSE HOOKS =============

/**
 * Get course by ID
 */
export function useCourse(id?: string) {
  return useSeasonalStore((state) => (id ? state.getCourse(id) : undefined));
}

/**
 * Get all unique courses
 */
export function useAllCourses() {
  return useSeasonalStore((state) => state.getAllCourses());
}

/**
 * Get courses by location
 */
export function useCoursesByLocation(location: string) {
  return useSeasonalStore((state) => state.getCoursesByLocation(location));
}

// ============= ADVANCED STATS HOOKS =============

/**
 * Get earnings distribution statistics
 */
export function useEarningsDistribution() {
  return useSeasonalStore((state) => state.getEarningsDistribution());
}

/**
 * Get tour statistics
 */
export function useTourStats() {
  return useSeasonalStore((state) => state.getTourStats());
}

/**
 * Get leaderboard for specific tour
 */
export function useLeaderboardByTour(tourId?: string) {
  return useSeasonalStore((state) =>
    tourId ? state.getLeaderboardByTour(tourId) : [],
  );
}

/**
 * Get tournament count by tier
 */
export function useTournamentCountByTier() {
  return useSeasonalStore((state) => state.getTournamentCountByTier());
}

/**
 * Get member count by tour
 */
export function useMemberCountByTour() {
  return useSeasonalStore((state) => state.getMemberCountByTour());
}

// ============= BULK OPERATIONS HOOKS =============

/**
 * Get all tours
 */
export function useAllTours() {
  return useSeasonalStore((state) => state.getAllTours());
}

/**
 * Get all tiers
 */
export function useAllTiers() {
  return useSeasonalStore((state) => state.getAllTiers());
}

/**
 * Get tournaments in date range
 */
export function useTournamentsInDateRange(start?: Date, end?: Date) {
  return useSeasonalStore((state) =>
    start && end ? state.getTournamentsInDateRange(start, end) : [],
  );
}

/**
 * Get tournaments by course
 */
export function useTournamentsByCourse(courseId?: string) {
  return useSeasonalStore((state) =>
    courseId ? state.getTournamentsByCourse(courseId) : [],
  );
}

/**
 * Get tournaments by status
 */
export function useTournamentsByStatus(status: TournamentStatus) {
  return useSeasonalStore((state) => state.getTournamentsByStatus(status));
}

// ============= SEARCH AND UTILITY HOOKS =============

/**
 * Search across all tours
 */
export function useSearchTours(query: string) {
  return useSeasonalStore((state) =>
    query.trim() ? state.searchTours(query.trim()) : [],
  );
}

/**
 * Search across all tiers
 */
export function useSearchTiers(query: string) {
  return useSeasonalStore((state) =>
    query.trim() ? state.searchTiers(query.trim()) : [],
  );
}

/**
 * Get data validation results
 */
export function useDataValidation() {
  return useSeasonalStore((state) => state.validateData());
}

/**
 * Get comprehensive data summary
 */
export function useDataSummary() {
  return useSeasonalStore((state) => state.getDataSummary());
}

// ============= BATCH OPERATIONS HOOKS =============

/**
 * Get actions for batch operations
 */
export function useBatchActions() {
  return useSeasonalStore((state) => ({
    batchUpdateTournaments: state.batchUpdateTournaments,
    batchUpdateTourCards: state.batchUpdateTourCards,
  }));
}

// ============= TYPED UTILITY TYPES =============

// Re-export types for external use
export type {
  TournamentFilters,
  TourCardFilters,
  SortDirection,
  TournamentStatus,
  MinimalTournament,
  MinimalTourCard,
  MinimalTour,
  MinimalTier,
  MinimalCourse,
} from "./seasonalStore";
