import {
  Course,
  Member,
  Season,
  Tier,
  Tour,
  TourCard,
  Tournament,
} from "@prisma/client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { logLocalStorageUsage, isApproachingQuota } from "@/lib/utils/storage";
import {
  getTournamentStatus,
  formatMoney,
  sortGolfers,
  groupBy,
  isDefined,
  isEmpty,
} from "@/lib/utils";

// Minimal types for store - only essential data without heavy includes
type MinimalCourse = Pick<Course, "id" | "name" | "location" | "par" | "apiId">;
type MinimalTier = Pick<Tier, "id" | "name" | "seasonId">;
type MinimalTour = Pick<
  Tour,
  "id" | "name" | "logoUrl" | "buyIn" | "shortForm"
>;
type MinimalTourCard = Pick<
  TourCard,
  | "id"
  | "memberId"
  | "tourId"
  | "seasonId"
  | "displayName"
  | "earnings"
  | "points"
  | "position"
>;

type MinimalTournament = Pick<
  Tournament,
  | "id"
  | "name"
  | "logoUrl"
  | "startDate"
  | "endDate"
  | "livePlay"
  | "currentRound"
  | "seasonId"
  | "courseId"
  | "tierId"
> & {
  course: MinimalCourse;
  tier: MinimalTier;
};

// Utility types for filtering and sorting
type SortDirection = "asc" | "desc";
type TournamentStatus = "upcoming" | "current" | "completed";

type TournamentFilters = {
  status?: TournamentStatus[];
  tierIds?: string[];
  courseIds?: string[];
  dateRange?: { start: Date; end: Date };
};

type TourCardFilters = {
  tourIds?: string[];
  minEarnings?: number;
  maxEarnings?: number;
  minPoints?: number;
  maxPoints?: number;
  hasEarnings?: boolean;
};

// Batch operation types
type BatchTourCardUpdate = {
  id: string;
  updates: Partial<MinimalTourCard>;
};

type BatchTournamentUpdate = {
  id: string;
  updates: Partial<MinimalTournament>;
};

type SeasonalData = {
  // Core data
  season: Season | null;
  member: Member | null;
  tourCard: TourCard | null;
  allTourCards: MinimalTourCard[] | null;
  tournaments: MinimalTournament[] | null;
  tiers: MinimalTier[] | null;
  tours: MinimalTour[] | null;
  lastLoaded: number | null;

  // Basic operations
  setSeasonalData: (data: Partial<SeasonalData>) => void;
  reset: () => void;
  updateMember: (member: Member) => void;
  clearAndSet: (data: Partial<SeasonalData>) => void;

  // Tournament operations
  getTournament: (id: string) => MinimalTournament | undefined;
  getCurrentTournament: () => MinimalTournament | undefined;
  getUpcomingTournaments: () => MinimalTournament[];
  getPastTournaments: () => MinimalTournament[];
  getTournamentsByTour: (tourId: string) => MinimalTournament[];
  getTournamentsByTier: (tierId: string) => MinimalTournament[];
  updateTournament: (id: string, updates: Partial<MinimalTournament>) => void;
  addTournament: (tournament: MinimalTournament) => void;
  removeTournament: (id: string) => void;

  // Advanced tournament operations
  filterTournaments: (filters: TournamentFilters) => MinimalTournament[];
  getTournamentsByStatus: (status: TournamentStatus) => MinimalTournament[];
  getTournamentsByCourse: (courseId: string) => MinimalTournament[];
  getTournamentsInDateRange: (start: Date, end: Date) => MinimalTournament[];
  batchUpdateTournaments: (updates: BatchTournamentUpdate[]) => void;

  // Tour operations
  getTour: (id: string) => MinimalTour | undefined;
  getToursById: (ids: string[]) => MinimalTour[];
  updateTour: (id: string, updates: Partial<MinimalTour>) => void;
  addTour: (tour: MinimalTour) => void;
  removeTour: (id: string) => void;
  getAllTours: () => MinimalTour[];

  // Tour card operations
  getTourCard: (id: string) => MinimalTourCard | undefined;
  getTourCardByMember: (memberId: string) => MinimalTourCard | undefined;
  getTourCardsByTour: (tourId: string) => MinimalTourCard[];
  getTopEarners: (limit?: number) => MinimalTourCard[];
  getLeaderboard: () => MinimalTourCard[];
  updateTourCard: (id: string, updates: Partial<MinimalTourCard>) => void;
  addTourCard: (tourCard: MinimalTourCard) => void;
  removeTourCard: (id: string) => void;

  // Advanced tour card operations
  filterTourCards: (filters: TourCardFilters) => MinimalTourCard[];
  getTourCardsByEarningsRange: (min: number, max: number) => MinimalTourCard[];
  getTourCardsByPointsRange: (min: number, max: number) => MinimalTourCard[];
  getActiveTourCards: () => MinimalTourCard[];
  getInactiveTourCards: () => MinimalTourCard[];
  batchUpdateTourCards: (updates: BatchTourCardUpdate[]) => void;
  sortTourCards: (
    key: keyof MinimalTourCard,
    direction: SortDirection,
  ) => MinimalTourCard[];

  // Tier operations
  getTier: (id: string) => MinimalTier | undefined;
  updateTier: (id: string, updates: Partial<MinimalTier>) => void;
  addTier: (tier: MinimalTier) => void;
  removeTier: (id: string) => void;
  getAllTiers: () => MinimalTier[];

  // Course operations (derived from tournaments)
  getCourse: (id: string) => MinimalCourse | undefined;
  getAllCourses: () => MinimalCourse[];
  getCoursesByLocation: (location: string) => MinimalCourse[];

  // Computed values
  getStandings: () => MinimalTourCard[];
  getTournamentStats: () => {
    total: number;
    completed: number;
    current: number;
    upcoming: number;
  };
  getMemberStats: () => {
    totalMembers: number;
    activeTourCards: number;
    totalEarnings: number;
  };
  getTourStats: () => {
    totalTours: number;
    totalBuyIn: number;
    avgBuyIn: number;
  };

  // Advanced computed values
  getEarningsDistribution: () => {
    total: number;
    average: number;
    median: number;
    top10Percent: number;
  };
  getLeaderboardByTour: (tourId: string) => MinimalTourCard[];
  getTournamentCountByTier: () => { [tierId: string]: number };
  getMemberCountByTour: () => { [tourId: string]: number };

  // Utility operations
  searchTournaments: (query: string) => MinimalTournament[];
  searchTourCards: (query: string) => MinimalTourCard[];
  searchTours: (query: string) => MinimalTour[];
  searchTiers: (query: string) => MinimalTier[];
  isDataStale: () => boolean;
  getDataAge: () => number;

  // Data validation and health checks
  validateData: () => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  getDataSummary: () => {
    tournaments: number;
    tourCards: number;
    tours: number;
    tiers: number;
    dataSize: string;
  };
};

// Export types for external use
export type {
  MinimalCourse,
  MinimalTier,
  MinimalTour,
  MinimalTourCard,
  MinimalTournament,
};
export type {
  SortDirection,
  TournamentStatus,
  TournamentFilters,
  TourCardFilters,
};
export type { BatchTourCardUpdate, BatchTournamentUpdate };

export const useSeasonalStore = create<SeasonalData>()(
  persist(
    (set, get) => ({
      season: null,
      member: null,
      tourCard: null,
      allTourCards: null,
      tournaments: null,
      tiers: null,
      tours: null,
      lastLoaded: null,

      // Basic operations
      setSeasonalData: (data) =>
        set((state) => ({ ...state, ...data, lastLoaded: Date.now() })),

      reset: () =>
        set({
          season: null,
          member: null,
          tourCard: null,
          allTourCards: null,
          tournaments: null,
          tiers: null,
          tours: null,
          lastLoaded: null,
        }),

      updateMember: (member: Member) =>
        set((state) => ({
          ...state,
          member: { ...state.member, ...member },
        })),

      clearAndSet: (data) => {
        // Clear localStorage first to prevent quota issues
        if (typeof window !== "undefined") {
          try {
            // Log current usage before clearing
            if (process.env.NODE_ENV === "development") {
              console.log("📊 Before clearing seasonal data:");
              logLocalStorageUsage();
            }

            localStorage.removeItem("seasonal-data-storage");
          } catch (e) {
            console.warn("Failed to clear localStorage:", e);
          }
        }

        const newData = {
          season: null,
          member: null,
          tourCard: null,
          allTourCards: null,
          tournaments: null,
          tiers: null,
          tours: null,
          lastLoaded: Date.now(),
          ...data,
        };

        set(newData);

        // Log storage usage after setting new data
        if (
          typeof window !== "undefined" &&
          process.env.NODE_ENV === "development"
        ) {
          setTimeout(() => {
            console.log("📊 After setting seasonal data:");
            logLocalStorageUsage();

            if (isApproachingQuota()) {
              console.warn(
                "⚠️ Seasonal data is approaching localStorage quota!",
              );
            }
          }, 100);
        }
      },

      // Tournament operations
      getTournament: (id: string) => {
        const state = get();
        return state.tournaments?.find((t) => t.id === id);
      },

      getCurrentTournament: () => {
        const state = get();
        const now = new Date();
        return state.tournaments?.find((t) => {
          const status = getTournamentStatus(t.startDate, t.endDate, now);
          return status === "current";
        });
      },

      getUpcomingTournaments: () => {
        const state = get();
        const now = new Date();
        return (state.tournaments ?? [])
          .filter((t) => {
            const status = getTournamentStatus(t.startDate, t.endDate, now);
            return status === "upcoming";
          })
          .sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          );
      },

      getPastTournaments: () => {
        const state = get();
        const now = new Date();
        return (state.tournaments ?? [])
          .filter((t) => {
            const status = getTournamentStatus(t.startDate, t.endDate, now);
            return status === "completed";
          })
          .sort(
            (a, b) =>
              new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
          );
      },

      getTournamentsByTour: (tourId: string) => {
        const state = get();
        // Note: We'd need to add tour relationships to tournaments for this to work fully
        return state.tournaments ?? [];
      },

      getTournamentsByTier: (tierId: string) => {
        const state = get();
        return (state.tournaments ?? []).filter((t) => t.tierId === tierId);
      },

      updateTournament: (id: string, updates: Partial<MinimalTournament>) => {
        set((state) => ({
          ...state,
          tournaments:
            state.tournaments?.map((t) =>
              t.id === id ? { ...t, ...updates } : t,
            ) ?? null,
        }));
      },

      addTournament: (tournament: MinimalTournament) => {
        set((state) => ({
          ...state,
          tournaments: [...(state.tournaments ?? []), tournament],
        }));
      },

      removeTournament: (id: string) => {
        set((state) => ({
          ...state,
          tournaments: state.tournaments?.filter((t) => t.id !== id) ?? null,
        }));
      },

      // Advanced tournament operations
      filterTournaments: (filters: TournamentFilters) => {
        const state = get();
        let tournaments = state.tournaments ?? [];

        if (filters.status) {
          tournaments = tournaments.filter((t) =>
            filters.status?.includes(
              getTournamentStatus(t.startDate, t.endDate, new Date()),
            ),
          );
        }

        if (filters.tierIds) {
          tournaments = tournaments.filter((t) =>
            filters.tierIds?.includes(t.tierId),
          );
        }

        if (filters.courseIds) {
          tournaments = tournaments.filter((t) =>
            filters.courseIds?.includes(t.courseId),
          );
        }

        if (filters.dateRange) {
          tournaments = tournaments.filter((t) => {
            const startDate = new Date(t.startDate);
            const endDate = new Date(t.endDate);
            return (
              startDate >= filters.dateRange!.start &&
              endDate <= filters.dateRange!.end
            );
          });
        }

        return tournaments;
      },

      getTournamentsByStatus: (status: TournamentStatus) => {
        const state = get();
        return (state.tournaments ?? []).filter(
          (t) =>
            getTournamentStatus(t.startDate, t.endDate, new Date()) === status,
        );
      },

      getTournamentsByCourse: (courseId: string) => {
        const state = get();
        return (state.tournaments ?? []).filter((t) => t.courseId === courseId);
      },

      getTournamentsInDateRange: (start: Date, end: Date) => {
        const state = get();
        return (state.tournaments ?? []).filter((t) => {
          const tournamentStart = new Date(t.startDate);
          const tournamentEnd = new Date(t.endDate);
          return tournamentStart >= start && tournamentEnd <= end;
        });
      },

      batchUpdateTournaments: (updates: BatchTournamentUpdate[]) => {
        set((state) => {
          let tournaments = state.tournaments ?? [];

          updates.forEach((update) => {
            tournaments = tournaments.map((t) =>
              t.id === update.id ? { ...t, ...update.updates } : t,
            );
          });

          return { ...state, tournaments };
        });
      },

      // Tour operations
      getTour: (id: string) => {
        const state = get();
        return state.tours?.find((t) => t.id === id);
      },

      getToursById: (ids: string[]) => {
        const state = get();
        return (state.tours ?? []).filter((t) => ids.includes(t.id));
      },

      updateTour: (id: string, updates: Partial<MinimalTour>) => {
        set((state) => ({
          ...state,
          tours:
            state.tours?.map((t) => (t.id === id ? { ...t, ...updates } : t)) ??
            null,
        }));
      },

      addTour: (tour: MinimalTour) => {
        set((state) => ({
          ...state,
          tours: [...(state.tours ?? []), tour],
        }));
      },

      removeTour: (id: string) => {
        set((state) => ({
          ...state,
          tours: state.tours?.filter((t) => t.id !== id) ?? null,
        }));
      },

      getAllTours: () => {
        const state = get();
        return state.tours ?? [];
      },

      // Tour card operations
      getTourCard: (id: string) => {
        const state = get();
        return state.allTourCards?.find((tc) => tc.id === id);
      },

      getTourCardByMember: (memberId: string) => {
        const state = get();
        return state.allTourCards?.find((tc) => tc.memberId === memberId);
      },

      getTourCardsByTour: (tourId: string) => {
        const state = get();
        return (state.allTourCards ?? []).filter((tc) => tc.tourId === tourId);
      },

      getTopEarners: (limit: number = 10) => {
        const state = get();
        return (state.allTourCards ?? [])
          .slice()
          .sort((a, b) => b.earnings - a.earnings)
          .slice(0, limit);
      },

      getLeaderboard: () => {
        const state = get();
        return (state.allTourCards ?? []).slice().sort((a, b) => {
          // Sort by points first, then earnings
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return b.earnings - a.earnings;
        });
      },

      updateTourCard: (id: string, updates: Partial<MinimalTourCard>) => {
        set((state) => ({
          ...state,
          allTourCards:
            state.allTourCards?.map((tc) =>
              tc.id === id ? { ...tc, ...updates } : tc,
            ) ?? null,
        }));
      },

      addTourCard: (tourCard: MinimalTourCard) => {
        set((state) => ({
          ...state,
          allTourCards: [...(state.allTourCards ?? []), tourCard],
        }));
      },

      removeTourCard: (id: string) => {
        set((state) => ({
          ...state,
          allTourCards:
            state.allTourCards?.filter((tc) => tc.id !== id) ?? null,
        }));
      },

      // Advanced tour card operations
      filterTourCards: (filters: TourCardFilters) => {
        const state = get();
        let tourCards = state.allTourCards ?? [];

        if (filters.tourIds) {
          tourCards = tourCards.filter((tc) =>
            filters.tourIds?.includes(tc.tourId),
          );
        }

        if (filters.minEarnings !== undefined) {
          tourCards = tourCards.filter(
            (tc) => tc.earnings >= filters.minEarnings!,
          );
        }

        if (filters.maxEarnings !== undefined) {
          tourCards = tourCards.filter(
            (tc) => tc.earnings <= filters.maxEarnings!,
          );
        }

        if (filters.minPoints !== undefined) {
          tourCards = tourCards.filter((tc) => tc.points >= filters.minPoints!);
        }

        if (filters.maxPoints !== undefined) {
          tourCards = tourCards.filter((tc) => tc.points <= filters.maxPoints!);
        }

        if (filters.hasEarnings) {
          tourCards = tourCards.filter((tc) => tc.earnings > 0);
        }

        return tourCards;
      },

      getTourCardsByEarningsRange: (min: number, max: number) => {
        const state = get();
        return (state.allTourCards ?? []).filter(
          (tc) => tc.earnings >= min && tc.earnings <= max,
        );
      },

      getTourCardsByPointsRange: (min: number, max: number) => {
        const state = get();
        return (state.allTourCards ?? []).filter(
          (tc) => tc.points >= min && tc.points <= max,
        );
      },

      getActiveTourCards: () => {
        const state = get();
        return (state.allTourCards ?? []).filter(
          (tc) => tc.earnings > 0 || tc.points > 0,
        );
      },

      getInactiveTourCards: () => {
        const state = get();
        return (state.allTourCards ?? []).filter(
          (tc) => tc.earnings === 0 && tc.points === 0,
        );
      },

      batchUpdateTourCards: (updates: BatchTourCardUpdate[]) => {
        set((state) => {
          let tourCards = state.allTourCards ?? [];

          updates.forEach((update) => {
            tourCards = tourCards.map((tc) =>
              tc.id === update.id ? { ...tc, ...update.updates } : tc,
            );
          });

          return { ...state, allTourCards: tourCards };
        });
      },

      sortTourCards: (key: keyof MinimalTourCard, direction: SortDirection) => {
        const state = get();
        return (state.allTourCards ?? []).slice().sort((a, b) => {
          const aVal = a[key];
          const bVal = b[key];
          if (aVal == null || bVal == null) return 0;
          if (aVal < bVal) {
            return direction === "asc" ? -1 : 1;
          }
          if (aVal > bVal) {
            return direction === "asc" ? 1 : -1;
          }
          return 0;
        });
      },

      // Tier operations
      getTier: (id: string) => {
        const state = get();
        return state.tiers?.find((t) => t.id === id);
      },

      updateTier: (id: string, updates: Partial<MinimalTier>) => {
        set((state) => ({
          ...state,
          tiers:
            state.tiers?.map((t) => (t.id === id ? { ...t, ...updates } : t)) ??
            null,
        }));
      },

      addTier: (tier: MinimalTier) => {
        set((state) => ({
          ...state,
          tiers: [...(state.tiers ?? []), tier],
        }));
      },

      removeTier: (id: string) => {
        set((state) => ({
          ...state,
          tiers: state.tiers?.filter((t) => t.id !== id) ?? null,
        }));
      },

      getAllTiers: () => {
        const state = get();
        return state.tiers ?? [];
      },

      // Course operations (derived from tournaments)
      getCourse: (id: string) => {
        const state = get();
        const tournament = state.tournaments?.find((t) => t.courseId === id);
        return tournament?.course;
      },

      getAllCourses: () => {
        const state = get();
        const courses: MinimalCourse[] = [];
        const seenIds = new Set<string>();

        state.tournaments?.forEach((t) => {
          if (!seenIds.has(t.course.id)) {
            courses.push(t.course);
            seenIds.add(t.course.id);
          }
        });

        return courses;
      },

      getCoursesByLocation: (location: string) => {
        const state = get();
        return get()
          .getAllCourses()
          .filter((c) => c.location === location);
      },

      // Computed values
      getStandings: () => {
        return get().getLeaderboard();
      },

      getTournamentStats: () => {
        const state = get();
        const tournaments = state.tournaments ?? [];
        const now = new Date();

        let completed = 0;
        let current = 0;
        let upcoming = 0;

        tournaments.forEach((t) => {
          const status = getTournamentStatus(t.startDate, t.endDate, now);
          if (status === "completed") completed++;
          else if (status === "current") current++;
          else if (status === "upcoming") upcoming++;
        });

        return {
          total: tournaments.length,
          completed,
          current,
          upcoming,
        };
      },

      getMemberStats: () => {
        const state = get();
        const tourCards = state.allTourCards ?? [];

        return {
          totalMembers: tourCards.length,
          activeTourCards: tourCards.filter(
            (tc) => tc.earnings > 0 || tc.points > 0,
          ).length,
          totalEarnings: tourCards.reduce((sum, tc) => sum + tc.earnings, 0),
        };
      },

      getTourStats: () => {
        const state = get();
        const tours = state.tours ?? [];

        return {
          totalTours: tours.length,
          totalBuyIn: tours.reduce((sum, t) => sum + (t.buyIn ?? 0), 0),
          avgBuyIn:
            tours.length > 0
              ? tours.reduce((sum, t) => sum + (t.buyIn ?? 0), 0) / tours.length
              : 0,
        };
      },

      // Advanced computed values
      getEarningsDistribution: () => {
        const state = get();
        const tourCards = state.allTourCards ?? [];
        const total = tourCards.reduce((sum, tc) => sum + tc.earnings, 0);
        const average = tourCards.length > 0 ? total / tourCards.length : 0;
        const sortedEarnings = tourCards
          .map((tc) => tc.earnings)
          .sort((a, b) => a - b);
        const median =
          sortedEarnings.length > 0
            ? sortedEarnings[Math.floor(sortedEarnings.length / 2)]!
            : 0;
        const top10PercentIndex = Math.floor(tourCards.length * 0.9);
        const top10Percent =
          sortedEarnings.length > 0 ? sortedEarnings[top10PercentIndex]! : 0;

        return {
          total,
          average,
          median,
          top10Percent,
        };
      },
      getLeaderboardByTour: (tourId: string) => {
        const state = get();
        return (state.allTourCards ?? [])
          .filter((tc) => tc.tourId === tourId)
          .sort((a, b) => {
            // Sort by points first, then earnings
            if (b.points !== a.points) {
              return b.points - a.points;
            }
            return b.earnings - a.earnings;
          });
      },
      getTournamentCountByTier: () => {
        const state = get();
        const tournaments = state.tournaments ?? [];
        const counts: { [tierId: string]: number } = {};

        tournaments.forEach((t) => {
          counts[t.tierId] = (counts[t.tierId] || 0) + 1;
        });

        return counts;
      },

      getMemberCountByTour: () => {
        const state = get();
        const tourCards = state.allTourCards ?? [];
        const counts: { [tourId: string]: number } = {};

        tourCards.forEach((tc) => {
          counts[tc.tourId] = (counts[tc.tourId] || 0) + 1;
        });

        return counts;
      },

      // Utility operations
      searchTournaments: (query: string) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        return (state.tournaments ?? []).filter(
          (t) =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.course.name.toLowerCase().includes(lowerQuery) ||
            t.course.location.toLowerCase().includes(lowerQuery),
        );
      },

      searchTourCards: (query: string) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        return (state.allTourCards ?? []).filter((tc) =>
          tc.displayName.toLowerCase().includes(lowerQuery),
        );
      },

      searchTours: (query: string) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        return (state.tours ?? []).filter((t) =>
          t.name.toLowerCase().includes(lowerQuery),
        );
      },

      searchTiers: (query: string) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        return (state.tiers ?? []).filter((t) =>
          t.name.toLowerCase().includes(lowerQuery),
        );
      },

      isDataStale: () => {
        const state = get();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        return !state.lastLoaded || Date.now() - state.lastLoaded > maxAge;
      },

      getDataAge: () => {
        const state = get();
        return state.lastLoaded ? Date.now() - state.lastLoaded : 0;
      },

      // Data validation and health checks
      validateData: () => {
        const state = get();
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check tournaments
        (state.tournaments ?? []).forEach((t) => {
          if (!t.name || !t.startDate || !t.endDate) {
            errors.push(`Tournament ${t.id} is missing essential fields.`);
          }
        });

        // Check tour cards
        (state.allTourCards ?? []).forEach((tc) => {
          if (
            !tc.displayName ||
            tc.earnings === undefined ||
            tc.points === undefined
          ) {
            errors.push(`Tour Card ${tc.id} is missing essential fields.`);
          }
        });

        // Check tours
        (state.tours ?? []).forEach((t) => {
          if (!t.name || t.buyIn === undefined) {
            errors.push(`Tour ${t.id} is missing essential fields.`);
          }
        });

        // Check tiers
        (state.tiers ?? []).forEach((t) => {
          if (!t.name) {
            errors.push(`Tier ${t.id} is missing essential fields.`);
          }
        });

        const isValid = errors.length === 0;

        return { isValid, errors, warnings };
      },

      getDataSummary: () => {
        const state = get();
        const tournaments = state.tournaments ?? [];
        const tourCards = state.allTourCards ?? [];
        const tours = state.tours ?? [];
        const tiers = state.tiers ?? [];

        return {
          tournaments: tournaments.length,
          tourCards: tourCards.length,
          tours: tours.length,
          tiers: tiers.length,
          dataSize: `${(JSON.stringify(state).length / 1024).toFixed(2)} KB`,
        };
      },
    }),
    {
      name: "seasonal-data-storage",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
    },
  ),
);
