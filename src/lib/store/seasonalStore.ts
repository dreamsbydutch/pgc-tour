import {
  filterItems,
  sortItems,
  searchItems,
  batchUpdateItems,
  cn,
} from "../utils/main";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  MinimalCourse,
  MinimalTier,
  MinimalTour,
  MinimalTourCard,
  MinimalTournament,
  SortDirection,
  TournamentStatus,
  TournamentFilters,
  TourCardFilters,
  BatchUpdate,
  SeasonalData,
} from "./seasonalTypes";
import type { Member, Season, TourCard } from "@prisma/client";

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

// --- Zustand store ---
export const useSeasonalStore = create<SeasonalData>()(
  persist((set, get) => ({
    season: null, member: null, tourCard: null, allTourCards: null,
    tournaments: null, tiers: null, tours: null, lastLoaded: null,
    setSeasonalData: data => set(s => ({ ...s, ...data, lastLoaded: Date.now() })),
    reset: () => set({ season: null, member: null, tourCard: null, allTourCards: null, tournaments: null, tiers: null, tours: null, lastLoaded: null }),
    updateMember: member => set(s => ({ ...s, member: { ...s.member, ...member } })),
    clearAndSet: data => {
      if (typeof window !== "undefined") {
        try {
          if (process.env.NODE_ENV === "development") console.log("📊 Before clearing seasonal data:");
          localStorage.removeItem("seasonal-data-storage");
        } catch (e) { console.warn("Failed to clear localStorage:", e); }
      }
      set({ season: null, member: null, tourCard: null, allTourCards: null, tournaments: null, tiers: null, tours: null, lastLoaded: Date.now(), ...data });
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        setTimeout(() => {
          console.log("📊 After setting seasonal data:");
          if (isApproachingQuota()) console.warn("⚠️ Seasonal data is approaching localStorage quota!");
        }, 100);
      }
    },
    getTournaments: (filters, sortBy, direction = "asc") => {
      let tournaments = get().tournaments ?? [];
      if (filters) {
        const filterObj: any = { ...filters };
        if (filters.status) {
          const now = new Date();
          tournaments = tournaments.filter(t => filters.status!.includes(getTournamentStatus(new Date(t.startDate), new Date(t.endDate), now)));
          delete filterObj.status;
        }
        tournaments = filterItems(tournaments, filterObj);
      }
      return sortBy ? sortItems(tournaments, sortBy, direction) : tournaments;
    },
    getTourCards: (filters, sortBy, direction = "desc") => {
      let tourCards = get().allTourCards ?? [];
      if (filters) {
        const filterObj: any = { ...filters };
        const applyRange = (arr: typeof tourCards, key: keyof typeof filters, field: keyof MinimalTourCard) => {
          const range = filters[key] as { min?: number; max?: number } | undefined;
          if (!range) return arr;
          let result = arr;
          if (range.min !== undefined) result = result.filter(tc => typeof tc[field] === "number" && tc[field] !== null && tc[field] >= range.min!);
          if (range.max !== undefined) result = result.filter(tc => typeof tc[field] === "number" && tc[field] !== null && tc[field] <= range.max!);
          delete filterObj[key];
          return result;
        };
        tourCards = applyRange(tourCards, "earnings", "earnings");
        tourCards = applyRange(tourCards, "points", "points");
        if (filters.hasEarnings) { tourCards = tourCards.filter(tc => tc.earnings > 0); delete filterObj.hasEarnings; }
        tourCards = filterItems(tourCards, filterObj);
      }
      return sortBy ? sortItems(tourCards, sortBy, direction) : tourCards;
    },
    getTours: (sortBy, direction = "asc") => {
      const tours = get().tours ?? [];
      return sortBy ? sortItems(tours, sortBy, direction) : tours;
    },
    getTiers: (sortBy, direction = "asc") => {
      const tiers = get().tiers ?? [];
      return sortBy ? sortItems(tiers, sortBy, direction) : tiers;
    },
    getCourses: location => {
      const { tournaments } = get();
      const courses: MinimalCourse[] = [];
      const seenIds = new Set<string>();
      tournaments?.forEach(t => { if (!seenIds.has(t.course.id)) { courses.push(t.course); seenIds.add(t.course.id); } });
      return location ? courses.filter(c => c.location === location) : courses;
    },
    updateItem: (type, id, updates) => set(s => {
      const field = type === "tourCards" ? "allTourCards" : type;
      const items = s[field] ?? [];
      return { ...s, [field]: items.map((item: any) => item.id === id ? { ...item, ...updates } : item) };
    }),
    addItem: (type, item) => set(s => {
      const field = type === "tourCards" ? "allTourCards" : type;
      const items = s[field] ?? [];
      return { ...s, [field]: [...items, item] };
    }),
    removeItem: (type, id) => set(s => {
      const field = type === "tourCards" ? "allTourCards" : type;
      const items = s[field] ?? [];
      return { ...s, [field]: items.filter((item: any) => item.id !== id) };
    }),
    batchUpdate: (type, updates) => set(s => {
      const field = type === "tourCards" ? "allTourCards" : type;
      const items = s[field] ?? [];
      const updateMap = new Map(updates.map(u => [u.id, u.updates]));
      return { ...s, [field]: items.map((item: any) => updateMap.has(item.id) ? { ...item, ...updateMap.get(item.id)! } : item) };
    }),
    search: (query, types = ["tournaments", "tourCards", "tours", "tiers"]) => {
      const s = get();
      return {
        tournaments: types.includes("tournaments") && s.tournaments ? searchItems(s.tournaments, query, ["name", "course.name", "course.location", "tier.name"]) : [],
        tourCards: types.includes("tourCards") && s.allTourCards ? searchItems(s.allTourCards, query, ["displayName"]) : [],
        tours: types.includes("tours") && s.tours ? searchItems(s.tours, query, ["name", "shortForm"]) : [],
        tiers: types.includes("tiers") && s.tiers ? searchItems(s.tiers, query, ["name"]) : [],
      };
    },
    getStats: () => {
      const s = get();
      const tournaments = s.tournaments ?? [], tourCards = s.allTourCards ?? [], tours = s.tours ?? [];
      const now = new Date();
      const tournamentsByStatus = groupBy<MinimalTournament, string>(
        tournaments,
        (t: MinimalTournament) => getTournamentStatus(new Date(t.startDate), new Date(t.endDate), now)
      );
      return {
        tournaments: {
          total: tournaments.length,
          byStatus: {
            upcoming: tournamentsByStatus.upcoming?.length ?? 0,
            current: tournamentsByStatus.current?.length ?? 0,
            completed: tournamentsByStatus.completed?.length ?? 0,
          },
          byTier: countByField(tournaments, "tierId"),
        },
        tourCards: {
          total: tourCards.length,
          active: tourCards.filter(tc => tc.earnings > 0 || tc.points > 0).length,
          earnings: calculateStats(tourCards.map(tc => tc.earnings)),
          byTour: countByField(tourCards, "tourId"),
        },
        tours: {
          total: tours.length,
          totalBuyIn: tours.reduce((sum, b) => sum + b.buyIn, 0),
          avgBuyIn: tours.length ? tours.reduce((sum, b) => sum + b.buyIn, 0) / tours.length : 0,
        },
      };
    },
    isDataStale: () => {
      const { lastLoaded } = get();
      return !lastLoaded || Date.now() - lastLoaded > 24 * 60 * 60 * 1000;
    },
    getDataAge: () => {
      const { lastLoaded } = get();
      return lastLoaded ? Date.now() - lastLoaded : 0;
    },
    validateData: () => {
      const { tournaments, allTourCards, tours, tiers } = get();
      const errors = [];
      if (!tournaments) errors.push("Tournaments data is missing");
      if (!allTourCards) errors.push("Tour cards data is missing");
      if (!tours) errors.push("Tours data is missing");
      if (!tiers) errors.push("Tiers data is missing");
      return { isValid: errors.length === 0, errors };
    },
  }), {
    name: "seasonal-data-storage",
    storage: typeof window !== "undefined" ? createJSONStorage(() => localStorage) : undefined,
  })
);

// --- Minimal local helpers (move to utils/main.ts if needed elsewhere) ---
const groupBy = <T, K extends string = string>(arr: T[], fn: (item: T) => K): Record<K, T[]> =>
  arr.reduce((acc, item) => {
    const key = fn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {} as Record<K, T[]>);

const calculateStats = (numbers: number[]) => {
  if (!numbers.length) return { total: 0, average: 0, median: 0, min: 0, max: 0 };
  const sorted = [...numbers].sort((a, b) => a - b);
  const total = numbers.reduce((sum, n) => sum + n, 0);
  return {
    total,
    average: total / numbers.length,
    median: sorted[Math.floor(sorted.length / 2)] ?? 0,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  };
};

const countByField = <T>(items: T[], field: keyof T) =>
  items.reduce((acc, item) => {
    const key = String(item[field]);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

const getTournamentStatus = (
  start: Date,
  end: Date,
  ref: Date = new Date(),
): 'upcoming' | 'current' | 'completed' => {
  const now = ref.getTime(), s = new Date(start).getTime(), e = new Date(end).getTime();
  return now < s ? 'upcoming' : now <= e ? 'current' : 'completed';
};

const isApproachingQuota = (threshold = 0.8) => {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const quota = 5 * 1024 * 1024;
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) total += (localStorage.getItem(key) || '').length;
    }
    return total / quota > threshold;
  } catch {
    return false;
  }
};
