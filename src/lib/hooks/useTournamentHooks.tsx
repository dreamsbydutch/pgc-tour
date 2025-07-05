/**
 * Tournament Hooks - Comprehensive Tournament Data Management
 *
 * Provides a complete, type-safe, and efficient set of hooks for working with tournament data.
 * Includes current, previous, next, season, historical tournaments with filtering, sorting,
 * grouping, search, pagination, and statistics.
 *
 * Features:
 * - Type-safe with proper MinimalTournament types
 * - Memoized selectors for performance
 * - Comprehensive error and loading state handling
 * - Filtering, sorting, grouping, search, and pagination
 * - Tournament statistics and analytics
 *
 * @fileoverview Minimal and efficient tournament data hooks
 */

import { useMemo } from "react";
import { useSeasonalStore } from "../store/seasonalStore";

// Import utilities from the new utils suite
import { golf, dates, processing } from "@/lib/utils";
import { groupBy, hasItems } from "@/lib/utils/core/arrays";
import { isEmpty } from "@/lib/utils/core/objects";
import { isDefined } from "@/lib/utils/core/types";

// Destructure processing utilities for cleaner usage
const { sortBy } = processing;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type MinimalTournament = {
  id: string;
  name: string;
  logoUrl: string | null;
  startDate: Date;
  endDate: Date;
  livePlay: boolean | null;
  currentRound: number | null;
  seasonId: string;
  courseId: string;
  tierId: string;
  course: {
    id: string;
    name: string;
    location: string;
    par: number;
    apiId: string;
  };
  tier: {
    id: string;
    name: string;
    seasonId: string;
  };
};

type TournamentStatus = "upcoming" | "current" | "completed";
type TournamentSort = "startDate" | "endDate" | "name" | "tier";

interface TournamentFilters {
  status?: TournamentStatus | TournamentStatus[];
  tierIds?: string[];
  courseIds?: string[];
  dateRange?: { start: Date; end: Date };
  search?: string;
}

interface TournamentHookResult {
  tournaments: MinimalTournament[];
  isLoading: boolean;
  error: string | null;
  count: number;
}

interface TournamentStats {
  total: number;
  upcoming: number;
  current: number;
  completed: number;
  byTier: Record<string, number>;
  byCourse: Record<string, number>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts raw tournament data to properly typed tournaments with Date objects
 */
function processRawTournaments(rawTournaments: any[]): MinimalTournament[] {
  if (!hasItems(rawTournaments)) return [];

  return rawTournaments.map((t) => ({
    ...t,
    startDate: new Date(t.startDate),
    endDate: new Date(t.endDate),
  }));
}

/**
 * Filters tournaments based on provided criteria
 */
function filterTournaments(
  tournaments: MinimalTournament[],
  filters: TournamentFilters = {},
): MinimalTournament[] {
  if (!hasItems(tournaments)) return [];

  let filtered = [...tournaments];

  // Filter by status
  if (filters.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status];
    filtered = filtered.filter((tournament) => {
      const status = golf.getTournamentStatus(
        tournament.startDate,
        tournament.endDate,
      );
      return statuses.includes(status);
    });
  }

  // Filter by tier IDs
  if (filters.tierIds && hasItems(filters.tierIds)) {
    filtered = filtered.filter((tournament) =>
      filters.tierIds!.includes(tournament.tierId),
    );
  }

  // Filter by course IDs
  if (filters.courseIds && hasItems(filters.courseIds)) {
    filtered = filtered.filter((tournament) =>
      filters.courseIds!.includes(tournament.courseId),
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(
      (tournament) =>
        tournament.startDate >= start && tournament.endDate <= end,
    );
  }

  // Filter by search term (name or course name)
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (tournament) =>
        tournament.name.toLowerCase().includes(searchLower) ||
        tournament.course.name.toLowerCase().includes(searchLower),
    );
  }

  return filtered;
}

/**
 * Sorts tournaments by specified criteria
 */
function sortTournaments(
  tournaments: MinimalTournament[],
  sortField: TournamentSort = "startDate",
  direction: "asc" | "desc" = "desc",
): MinimalTournament[] {
  if (!hasItems(tournaments)) return [];

  return sortBy(tournaments, [
    { key: sortField as keyof MinimalTournament, direction },
  ]);
}

/**
 * Calculates tournament statistics
 */
function calculateTournamentStats(
  tournaments: MinimalTournament[],
): TournamentStats {
  if (!hasItems(tournaments)) {
    return {
      total: 0,
      upcoming: 0,
      current: 0,
      completed: 0,
      byTier: {},
      byCourse: {},
    };
  }

  const stats: TournamentStats = {
    total: tournaments.length,
    upcoming: 0,
    current: 0,
    completed: 0,
    byTier: {},
    byCourse: {},
  };

  tournaments.forEach((tournament) => {
    const status = golf.getTournamentStatus(
      tournament.startDate,
      tournament.endDate,
    );
    stats[status]++;

    // Count by tier
    const tierName = tournament.tier.name;
    stats.byTier[tierName] = (stats.byTier[tierName] || 0) + 1;

    // Count by course
    const courseName = tournament.course.name;
    stats.byCourse[courseName] = (stats.byCourse[courseName] || 0) + 1;
  });

  return stats;
}

// ============================================================================
// BASE HOOK
// ============================================================================

/**
 * Base hook that provides processed tournaments with error handling
 */
function useProcessedTournaments(): TournamentHookResult {
  const rawTournaments = useSeasonalStore((state) => state.tournaments);

  return useMemo(() => {
    if (!rawTournaments) {
      return {
        tournaments: [],
        isLoading: true,
        error: null,
        count: 0,
      };
    }

    if (isEmpty(rawTournaments)) {
      return {
        tournaments: [],
        isLoading: false,
        error: "No tournaments available",
        count: 0,
      };
    }

    try {
      const processed = processRawTournaments(rawTournaments);
      return {
        tournaments: processed,
        isLoading: false,
        error: null,
        count: processed.length,
      };
    } catch (error) {
      return {
        tournaments: [],
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process tournaments",
        count: 0,
      };
    }
  }, [rawTournaments]);
}

// ============================================================================
// SPECIFIC TOURNAMENT HOOKS
// ============================================================================

/**
 * Returns the current active tournament
 */
export function useCurrentTournament(): MinimalTournament | undefined {
  const { tournaments } = useProcessedTournaments();

  return useMemo(() => {
    return tournaments.find((tournament) => {
      const status = golf.getTournamentStatus(
        tournament.startDate,
        tournament.endDate,
      );
      return status === "current";
    });
  }, [tournaments]);
}

/**
 * Returns the most recently completed tournament (within last 3 days)
 */
export function useLastTournament(): MinimalTournament | undefined {
  const { tournaments } = useProcessedTournaments();

  return useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    return tournaments
      .filter((tournament) => {
        const status = golf.getTournamentStatus(
          tournament.startDate,
          tournament.endDate,
        );
        return status === "completed" && tournament.endDate >= threeDaysAgo;
      })
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];
  }, [tournaments]);
}

/**
 * Returns the next upcoming tournament
 */
export function useNextTournament(): MinimalTournament | undefined {
  const { tournaments } = useProcessedTournaments();

  return useMemo(() => {
    return tournaments
      .filter((tournament) => {
        const status = golf.getTournamentStatus(
          tournament.startDate,
          tournament.endDate,
        );
        return status === "upcoming";
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];
  }, [tournaments]);
}

/**
 * Returns the previous completed tournament (before the last tournament)
 */
export function usePreviousTournament(): MinimalTournament | undefined {
  const { tournaments } = useProcessedTournaments();

  return useMemo(() => {
    const completed = tournaments
      .filter((tournament) => {
        const status = golf.getTournamentStatus(
          tournament.startDate,
          tournament.endDate,
        );
        return status === "completed";
      })
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

    // Return the second most recent (previous)
    return completed[1];
  }, [tournaments]);
}

// ============================================================================
// COLLECTION HOOKS
// ============================================================================

/**
 * Returns all tournaments for the current season with filtering and sorting
 */
export function useSeasonTournaments(
  filters: TournamentFilters = {},
  sortField: TournamentSort = "startDate",
  direction: "asc" | "desc" = "asc",
): TournamentHookResult {
  const { tournaments, isLoading, error } = useProcessedTournaments();

  return useMemo(() => {
    if (isLoading || error) {
      return { tournaments: [], isLoading, error, count: 0 };
    }

    const filtered = filterTournaments(tournaments, filters);
    const sorted = sortTournaments(filtered, sortField, direction);

    return {
      tournaments: sorted,
      isLoading: false,
      error: null,
      count: sorted.length,
    };
  }, [tournaments, filters, sortField, direction, isLoading, error]);
}

/**
 * Returns tournaments grouped by status
 */
export function useTournamentsByStatus(): {
  upcoming: MinimalTournament[];
  current: MinimalTournament[];
  completed: MinimalTournament[];
  isLoading: boolean;
  error: string | null;
} {
  const { tournaments, isLoading, error } = useProcessedTournaments();

  return useMemo(() => {
    if (isLoading || error) {
      return {
        upcoming: [],
        current: [],
        completed: [],
        isLoading,
        error,
      };
    }

    const grouped = groupBy(tournaments, (tournament: MinimalTournament) =>
      golf.getTournamentStatus(tournament.startDate, tournament.endDate),
    );

    return {
      upcoming: sortTournaments(grouped.upcoming || [], "startDate", "asc"),
      current: grouped.current || [],
      completed: sortTournaments(grouped.completed || [], "endDate", "desc"),
      isLoading: false,
      error: null,
    };
  }, [tournaments, isLoading, error]);
}

/**
 * Returns tournaments grouped by tier
 */
export function useTournamentsByTier(): {
  byTier: Record<string, MinimalTournament[]>;
  tiers: string[];
  isLoading: boolean;
  error: string | null;
} {
  const { tournaments, isLoading, error } = useProcessedTournaments();

  return useMemo(() => {
    if (isLoading || error) {
      return {
        byTier: {},
        tiers: [],
        isLoading,
        error,
      };
    }

    const grouped = groupBy(
      tournaments,
      (tournament: MinimalTournament) => tournament.tier.name,
    );
    const tiers = Object.keys(grouped).sort();

    // Sort tournaments within each tier by start date
    const sortedByTier: Record<string, MinimalTournament[]> = {};
    tiers.forEach((tier) => {
      sortedByTier[tier] = sortTournaments(
        grouped[tier] || [],
        "startDate",
        "asc",
      );
    });

    return {
      byTier: sortedByTier,
      tiers,
      isLoading: false,
      error: null,
    };
  }, [tournaments, isLoading, error]);
}

/**
 * Returns historical tournaments (completed only) with pagination support
 */
export function useHistoricalTournaments(
  page: number = 1,
  pageSize: number = 10,
  filters: Omit<TournamentFilters, "status"> = {},
): TournamentHookResult & {
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
} {
  const { tournaments, isLoading, error } = useProcessedTournaments();

  return useMemo(() => {
    if (isLoading || error) {
      return {
        tournaments: [],
        isLoading,
        error,
        count: 0,
        totalPages: 0,
        currentPage: page,
        hasNext: false,
        hasPrevious: false,
      };
    }

    // Filter for completed tournaments only
    const historicalFilters: TournamentFilters = {
      ...filters,
      status: "completed",
    };

    const filtered = filterTournaments(tournaments, historicalFilters);
    const sorted = sortTournaments(filtered, "endDate", "desc");

    // Pagination
    const totalPages = Math.ceil(sorted.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTournaments = sorted.slice(startIndex, endIndex);

    return {
      tournaments: paginatedTournaments,
      isLoading: false,
      error: null,
      count: sorted.length,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }, [tournaments, page, pageSize, filters, isLoading, error]);
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Returns comprehensive tournament statistics
 */
export function useTournamentStats(): TournamentStats & {
  isLoading: boolean;
  error: string | null;
} {
  const { tournaments, isLoading, error } = useProcessedTournaments();

  return useMemo(() => {
    if (isLoading || error) {
      return {
        total: 0,
        upcoming: 0,
        current: 0,
        completed: 0,
        byTier: {},
        byCourse: {},
        isLoading,
        error,
      };
    }

    const stats = calculateTournamentStats(tournaments);
    return {
      ...stats,
      isLoading: false,
      error: null,
    };
  }, [tournaments, isLoading, error]);
}

/**
 * Search hook for tournaments with search functionality
 */
export function useSearchTournaments(
  searchQuery: string,
  additionalFilters: Omit<TournamentFilters, "search"> = {},
  sortField: TournamentSort = "startDate",
  direction: "asc" | "desc" = "desc",
): TournamentHookResult {
  const { tournaments, isLoading, error } = useProcessedTournaments();

  return useMemo(() => {
    if (isLoading || error) {
      return { tournaments: [], isLoading, error, count: 0 };
    }

    if (!searchQuery.trim()) {
      return { tournaments: [], isLoading: false, error: null, count: 0 };
    }

    const filters: TournamentFilters = {
      ...additionalFilters,
      search: searchQuery,
    };

    const filtered = filterTournaments(tournaments, filters);
    const sorted = sortTournaments(filtered, sortField, direction);

    return {
      tournaments: sorted,
      isLoading: false,
      error: null,
      count: sorted.length,
    };
  }, [
    tournaments,
    searchQuery,
    additionalFilters,
    sortField,
    direction,
    isLoading,
    error,
  ]);
}

/**
 * Returns a specific tournament by ID
 */
export function useTournamentById(tournamentId: string | undefined): {
  tournament: MinimalTournament | undefined;
  isLoading: boolean;
  error: string | null;
} {
  const { tournaments, isLoading, error } = useProcessedTournaments();

  return useMemo(() => {
    if (!tournamentId) {
      return {
        tournament: undefined,
        isLoading: false,
        error: "No tournament ID provided",
      };
    }

    if (isLoading || error) {
      return { tournament: undefined, isLoading, error };
    }

    const tournament = tournaments.find((t) => t.id === tournamentId);

    return {
      tournament,
      isLoading: false,
      error: tournament ? null : "Tournament not found",
    };
  }, [tournaments, tournamentId, isLoading, error]);
}

// ============================================================================
// ADVANCED UTILITY HOOKS
// ============================================================================

/**
 * Returns tournaments within a specific date range
 */
export function useTournamentsInDateRange(
  startDate: Date,
  endDate: Date,
  includeStatuses: TournamentStatus[] = ["upcoming", "current", "completed"],
): TournamentHookResult {
  const filters: TournamentFilters = {
    dateRange: { start: startDate, end: endDate },
    status: includeStatuses,
  };

  return useSeasonTournaments(filters, "startDate", "asc");
}

/**
 * Returns upcoming tournaments in the next N days
 */
export function useUpcomingTournamentsInDays(
  days: number = 30,
): TournamentHookResult {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return useTournamentsInDateRange(now, futureDate, ["upcoming"]);
}

/**
 * Returns tournaments for a specific tier
 */
export function useTournamentsByTierId(tierId: string): TournamentHookResult {
  const filters: TournamentFilters = { tierIds: [tierId] };
  return useSeasonTournaments(filters, "startDate", "asc");
}

/**
 * Returns tournaments for a specific course
 */
export function useTournamentsByCourseId(
  courseId: string,
): TournamentHookResult {
  const filters: TournamentFilters = { courseIds: [courseId] };
  return useSeasonTournaments(filters, "startDate", "asc");
}

/**
 * Advanced hook that provides all tournament data in a single call
 * Useful for complex components that need multiple tournament datasets
 */
export function useAllTournamentData() {
  const { tournaments, isLoading, error } = useProcessedTournaments();
  const current = useCurrentTournament();
  const next = useNextTournament();
  const last = useLastTournament();
  const previous = usePreviousTournament();
  const byStatus = useTournamentsByStatus();
  const byTier = useTournamentsByTier();
  const stats = useTournamentStats();

  return useMemo(
    () => ({
      // All tournaments
      all: tournaments,

      // Individual tournaments
      current,
      next,
      last,
      previous,

      // Grouped data
      byStatus,
      byTier,

      // Statistics
      stats,

      // Meta
      isLoading,
      error,
      count: tournaments.length,
    }),
    [
      tournaments,
      current,
      next,
      last,
      previous,
      byStatus,
      byTier,
      stats,
      isLoading,
      error,
    ],
  );
}
