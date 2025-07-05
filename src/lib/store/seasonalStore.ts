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
import { logLocalStorageUsage, isApproachingQuota } from "@/old-utils/storage";
import {
  getTournamentStatus,
  createCrudOps,
  filterItems,
  sortItems,
  searchItems,
  calculateStats,
  countByField,
  groupBy,
} from "@/old-utils";

// Minimal types for store - only essential data without heavy includes
type MinimalCourse = Pick<Course, "id" | "name" | "location" | "par" | "apiId">;
type MinimalTier = Pick<Tier, "id" | "name" | "seasonId">;
type MinimalTour = Pick<
  Tour,
  "id" | "name" | "logoUrl" | "buyIn" | "shortForm" | "seasonId"
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

// Utility types
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
  earnings?: { min?: number; max?: number };
  points?: { min?: number; max?: number };
  hasEarnings?: boolean;
};

type BatchUpdate<T> = { id: string; updates: Partial<T> };

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

  // Generic getters with filtering and sorting
  getTournaments: (
    filters?: TournamentFilters,
    sortBy?: keyof MinimalTournament,
    direction?: SortDirection,
  ) => MinimalTournament[];
  getTourCards: (
    filters?: TourCardFilters,
    sortBy?: keyof MinimalTourCard,
    direction?: SortDirection,
  ) => MinimalTourCard[];
  getTours: (
    sortBy?: keyof MinimalTour,
    direction?: SortDirection,
  ) => MinimalTour[];
  getTiers: (
    sortBy?: keyof MinimalTier,
    direction?: SortDirection,
  ) => MinimalTier[];
  getCourses: (location?: string) => MinimalCourse[];

  // CRUD operations
  updateItem: <T extends { id: string }>(
    type: "tournaments" | "tourCards" | "tours" | "tiers",
    id: string,
    updates: Partial<T>,
  ) => void;
  addItem: <T>(
    type: "tournaments" | "tourCards" | "tours" | "tiers",
    item: T,
  ) => void;
  removeItem: (
    type: "tournaments" | "tourCards" | "tours" | "tiers",
    id: string,
  ) => void;
  batchUpdate: <T extends { id: string }>(
    type: "tournaments" | "tourCards",
    updates: BatchUpdate<T>[],
  ) => void;

  // Search operations
  search: (
    query: string,
    types?: ("tournaments" | "tourCards" | "tours" | "tiers")[],
  ) => {
    tournaments: MinimalTournament[];
    tourCards: MinimalTourCard[];
    tours: MinimalTour[];
    tiers: MinimalTier[];
  };

  // Computed values
  getStats: () => {
    tournaments: {
      total: number;
      byStatus: Record<TournamentStatus, number>;
      byTier: Record<string, number>;
    };
    tourCards: {
      total: number;
      active: number;
      earnings: ReturnType<typeof calculateStats>;
      byTour: Record<string, number>;
    };
    tours: { total: number; totalBuyIn: number; avgBuyIn: number };
  };

  // Utility
  isDataStale: () => boolean;
  getDataAge: () => number;
  validateData: () => { isValid: boolean; errors: string[] };
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
export type { BatchUpdate };

export const useSeasonalStore = create<SeasonalData>()(
  persist(
    (set, get) => {
      // Create CRUD operations for each data type
      const tournamentCrud = createCrudOps<MinimalTournament>();
      const tourCardCrud = createCrudOps<MinimalTourCard>();
      const tourCrud = createCrudOps<MinimalTour>();
      const tierCrud = createCrudOps<MinimalTier>();

      return {
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

        // Generic getters with filtering and sorting
        getTournaments: (filters, sortBy, direction = "asc") => {
          const state = get();
          let tournaments = state.tournaments ?? [];

          // Apply filters
          if (filters) {
            // Convert status filter for tournament filtering
            const filterObj: any = { ...filters };
            if (filters.status) {
              const now = new Date();
              tournaments = tournaments.filter((t) => {
                const status = getTournamentStatus(t.startDate, t.endDate, now);
                return filters.status!.includes(status as TournamentStatus);
              });
              delete filterObj.status;
            }
            tournaments = filterItems(tournaments, filterObj);
          }

          // Apply sorting
          if (sortBy) {
            tournaments = sortItems(tournaments, sortBy, direction);
          }

          return tournaments;
        },

        getTourCards: (filters, sortBy, direction = "desc") => {
          const state = get();
          let tourCards = state.allTourCards ?? [];

          // Apply filters
          if (filters) {
            const filterObj: any = { ...filters };

            // Handle earnings range
            if (filters.earnings) {
              if (filters.earnings.min !== undefined) {
                tourCards = tourCards.filter(
                  (tc) => tc.earnings >= filters.earnings!.min!,
                );
              }
              if (filters.earnings.max !== undefined) {
                tourCards = tourCards.filter(
                  (tc) => tc.earnings <= filters.earnings!.max!,
                );
              }
              delete filterObj.earnings;
            }

            // Handle points range
            if (filters.points) {
              if (filters.points.min !== undefined) {
                tourCards = tourCards.filter(
                  (tc) => tc.points >= filters.points!.min!,
                );
              }
              if (filters.points.max !== undefined) {
                tourCards = tourCards.filter(
                  (tc) => tc.points <= filters.points!.max!,
                );
              }
              delete filterObj.points;
            }

            // Handle hasEarnings
            if (filters.hasEarnings) {
              tourCards = tourCards.filter((tc) => tc.earnings > 0);
              delete filterObj.hasEarnings;
            }

            tourCards = filterItems(tourCards, filterObj);
          }

          // Apply sorting
          if (sortBy) {
            tourCards = sortItems(tourCards, sortBy, direction);
          }

          return tourCards;
        },

        getTours: (sortBy, direction = "asc") => {
          const state = get();
          let tours = state.tours ?? [];
          return sortBy ? sortItems(tours, sortBy, direction) : tours;
        },

        getTiers: (sortBy, direction = "asc") => {
          const state = get();
          let tiers = state.tiers ?? [];
          return sortBy ? sortItems(tiers, sortBy, direction) : tiers;
        },

        getCourses: (location) => {
          const state = get();
          const courses: MinimalCourse[] = [];
          const seenIds = new Set<string>();

          state.tournaments?.forEach((t) => {
            if (!seenIds.has(t.course.id)) {
              courses.push(t.course);
              seenIds.add(t.course.id);
            }
          });

          return location
            ? courses.filter((c) => c.location === location)
            : courses;
        },

        // CRUD operations
        updateItem: (type, id, updates) => {
          set((state) => {
            const field = type === "tourCards" ? "allTourCards" : type;
            const items = state[field] ?? [];
            return {
              ...state,
              [field]: items.map((item: any) =>
                item.id === id ? { ...item, ...updates } : item,
              ),
            };
          });
        },

        addItem: (type, item) => {
          set((state) => {
            const field = type === "tourCards" ? "allTourCards" : type;
            const items = state[field] ?? [];
            return {
              ...state,
              [field]: [...items, item],
            };
          });
        },

        removeItem: (type, id) => {
          set((state) => {
            const field = type === "tourCards" ? "allTourCards" : type;
            const items = state[field] ?? [];
            return {
              ...state,
              [field]: items.filter((item: any) => item.id !== id),
            };
          });
        },

        batchUpdate: (type, updates) => {
          set((state) => {
            const field = type === "tourCards" ? "allTourCards" : type;
            const items = state[field] ?? [];
            const updateMap = new Map(updates.map((u) => [u.id, u.updates]));

            return {
              ...state,
              [field]: items.map((item: any) => {
                const update = updateMap.get(item.id);
                return update ? { ...item, ...update } : item;
              }),
            };
          });
        },

        // Search operations
        search: (
          query,
          types = ["tournaments", "tourCards", "tours", "tiers"],
        ) => {
          const state = get();
          const results = {
            tournaments: [] as MinimalTournament[],
            tourCards: [] as MinimalTourCard[],
            tours: [] as MinimalTour[],
            tiers: [] as MinimalTier[],
          };

          if (types.includes("tournaments") && state.tournaments) {
            results.tournaments = searchItems(state.tournaments, query, [
              "name",
              "course.name",
              "course.location",
              "tier.name",
            ]);
          }

          if (types.includes("tourCards") && state.allTourCards) {
            results.tourCards = searchItems(state.allTourCards, query, [
              "displayName",
            ]);
          }

          if (types.includes("tours") && state.tours) {
            results.tours = searchItems(state.tours, query, [
              "name",
              "shortForm",
            ]);
          }

          if (types.includes("tiers") && state.tiers) {
            results.tiers = searchItems(state.tiers, query, ["name"]);
          }

          return results;
        },

        // Computed values
        getStats: () => {
          const state = get();
          const tournaments = state.tournaments ?? [];
          const tourCards = state.allTourCards ?? [];
          const tours = state.tours ?? [];

          // Tournament stats
          const now = new Date();
          const tournamentsByStatus = groupBy(tournaments, (t) =>
            getTournamentStatus(t.startDate, t.endDate, now),
          );

          const tournamentStats = {
            total: tournaments.length,
            byStatus: {
              upcoming: tournamentsByStatus.upcoming?.length ?? 0,
              current: tournamentsByStatus.current?.length ?? 0,
              completed: tournamentsByStatus.completed?.length ?? 0,
            } as Record<TournamentStatus, number>,
            byTier: countByField(tournaments, "tierId"),
          };

          // Tour card stats
          const earnings = tourCards.map((tc) => tc.earnings);
          const tourCardStats = {
            total: tourCards.length,
            active: tourCards.filter((tc) => tc.earnings > 0 || tc.points > 0)
              .length,
            earnings: calculateStats(earnings),
            byTour: countByField(tourCards, "tourId"),
          };

          // Tour stats
          const buyIns = tours.map((t) => t.buyIn);
          const tourStats = {
            total: tours.length,
            totalBuyIn: buyIns.reduce((sum, b) => sum + b, 0),
            avgBuyIn:
              buyIns.length > 0
                ? buyIns.reduce((sum, b) => sum + b, 0) / buyIns.length
                : 0,
          };

          return {
            tournaments: tournamentStats,
            tourCards: tourCardStats,
            tours: tourStats,
          };
        },

        // Utility
        isDataStale: () => {
          const state = get();
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          return !state.lastLoaded || Date.now() - state.lastLoaded > maxAge;
        },

        getDataAge: () => {
          const state = get();
          return state.lastLoaded ? Date.now() - state.lastLoaded : 0;
        },

        validateData: () => {
          const state = get();
          const errors: string[] = [];

          if (!state.tournaments) errors.push("Tournaments data is missing");
          if (!state.allTourCards) errors.push("Tour cards data is missing");
          if (!state.tours) errors.push("Tours data is missing");
          if (!state.tiers) errors.push("Tiers data is missing");

          return { isValid: errors.length === 0, errors };
        },
      };
    },
    {
      name: "seasonal-data-storage",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
    },
  ),
);
