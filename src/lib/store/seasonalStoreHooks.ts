/**
 * @fileoverview Compact hooks for the seasonal store
 * Provides efficient, reusable hooks with minimal code duplication
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
} from "./seasonalStore";

// ============= BASIC DATA HOOKS =============

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

export const useTournaments = (
  filters?: TournamentFilters,
  sortBy?: keyof MinimalTournament,
  direction?: SortDirection,
) =>
  useSeasonalStore((state) => state.getTournaments(filters, sortBy, direction));

export const useTourCards = (
  filters?: TourCardFilters,
  sortBy?: keyof MinimalTourCard,
  direction?: SortDirection,
) =>
  useSeasonalStore((state) => state.getTourCards(filters, sortBy, direction));

export const useTours = (
  sortBy?: keyof MinimalTour,
  direction?: SortDirection,
) => useSeasonalStore((state) => state.getTours(sortBy, direction));

export const useTiers = (
  sortBy?: keyof MinimalTier,
  direction?: SortDirection,
) => useSeasonalStore((state) => state.getTiers(sortBy, direction));

export const useCourses = (location?: string) =>
  useSeasonalStore((state) => state.getCourses(location));

// ============= CONVENIENCE HOOKS =============

// Current tournament
export const useCurrentTournament = () =>
  useTournaments({ status: ["current"] })[0];

// Upcoming tournaments
export const useUpcomingTournaments = () =>
  useTournaments({ status: ["upcoming"] }, "startDate", "asc");

// Past tournaments
export const usePastTournaments = () =>
  useTournaments({ status: ["completed"] }, "endDate", "desc");

// Leaderboard (tour cards sorted by points, then earnings)
export const useLeaderboard = () => useTourCards(undefined, "points", "desc");

// Top earners
export const useTopEarners = (limit = 10) =>
  useTourCards(undefined, "earnings", "desc").slice(0, limit);

// Active tour cards (with earnings or points)
export const useActiveTourCards = () => useTourCards({ hasEarnings: true });

// Tour cards by tour
export const useTourCardsByTour = (tourId: string) =>
  useTourCards({ tourIds: [tourId] }, "earnings", "desc");

// Tournaments by tier
export const useTournamentsByTier = (tierId: string) =>
  useTournaments({ tierIds: [tierId] }, "startDate", "asc");

// My tour card
export const useMyTourCard = () => {
  const member = useSeasonalStore((state) => state.member);
  const tourCards = useTourCards();
  return member ? tourCards.find((tc) => tc.memberId === member.id) : undefined;
};

// ============= SEARCH HOOKS =============

export const useSearch = (
  query: string,
  types?: ("tournaments" | "tourCards" | "tours" | "tiers")[],
) => useSeasonalStore((state) => state.search(query, types));

// ============= STATS HOOKS =============

export const useStats = () => useSeasonalStore((state) => state.getStats());

export const useTournamentStats = () => useStats().tournaments;
export const useTourCardStats = () => useStats().tourCards;
export const useTourStats = () => useStats().tours;

// ============= UTILITY HOOKS =============

export const useDataFreshness = () =>
  useSeasonalStore((state) => ({
    isStale: state.isDataStale(),
    age: state.getDataAge(),
    lastLoaded: state.lastLoaded,
  }));

export const useDataValidation = () =>
  useSeasonalStore((state) => state.validateData());

// ============= DERIVED HOOKS =============

// Tournaments grouped by status
export const useTournamentsByStatus = () => {
  const current = useCurrentTournament();
  const upcoming = useUpcomingTournaments();
  const past = usePastTournaments();

  return {
    current: current ? [current] : [],
    upcoming,
    past,
  };
};

// Earnings distribution
export const useEarningsDistribution = () => {
  const stats = useTourCardStats();
  return stats.earnings;
};

// Tournament count by tier
export const useTournamentCountByTier = () => {
  const stats = useTournamentStats();
  return stats.byTier;
};

// Member count by tour
export const useMemberCountByTour = () => {
  const stats = useTourCardStats();
  return stats.byTour;
};

// ============= INDIVIDUAL ITEM HOOKS =============

export const useTournament = (id?: string) => {
  const tournaments = useTournaments();
  return id ? tournaments.find((t) => t.id === id) : undefined;
};

export const useTourCard = (id?: string) => {
  const tourCards = useTourCards();
  return id ? tourCards.find((tc) => tc.id === id) : undefined;
};

export const useTour = (id?: string) => {
  const tours = useTours();
  return id ? tours.find((t) => t.id === id) : undefined;
};

export const useTier = (id?: string) => {
  const tiers = useTiers();
  return id ? tiers.find((t) => t.id === id) : undefined;
};

export const useCourse = (id?: string) => {
  const courses = useCourses();
  return id ? courses.find((c) => c.id === id) : undefined;
};

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
