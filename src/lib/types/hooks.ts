/**
 * Hook Result Types
 *
 * Centralized type definitions for all hook return patterns across the application.
 * These types provide consistent interfaces for hook results, enabling better
 * composition and type safety.
 *
 * @fileoverview Hook result interface definitions
 */

import type { Tournament } from "@prisma/client";
import type {
  MinimalTournament,
  EnrichedTeam,
  TourGroup,
  EnrichedTourCard,
  MinimalMember,
  TournamentStatus,
  TournamentSort,
  TourCardSort,
} from "./entities.js";

// ============================================================================
// BASE HOOK RESULT PATTERNS
// ============================================================================

/**
 * Base interface for all hook results
 * Provides consistent error handling and loading states
 */
export interface BaseHookResult<T = any> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refetch?: () => void;
}

/**
 * Paginated hook result interface
 * For hooks that support infinite scrolling or pagination
 */
export interface PaginatedHookResult<T> extends BaseHookResult<T[]> {
  hasMore: boolean;
  loadMore: () => void;
  total: number;
}

/**
 * Filtered hook result interface
 * For hooks that support filtering and search functionality
 */
export interface FilteredHookResult<T, F> extends BaseHookResult<T[]> {
  filters: F;
  setFilters: (filters: Partial<F>) => void;
  clearFilters: () => void;
}

/**
 * Cached hook result interface
 * For hooks that provide cache management
 */
export interface CachedHookResult<T> extends BaseHookResult<T> {
  lastUpdated?: Date;
  invalidateCache: () => void;
  isStale: boolean;
}

// ============================================================================
// TEAM-SPECIFIC HOOK RESULTS
// ============================================================================

/**
 * Champions result interface
 * For latest tournament champions display
 */
export interface ChampionsResult {
  tournament?: MinimalTournament;
  champs: EnrichedTeam[];
  daysRemaining?: number;
  error: string | null;
  isLoading: boolean;
}

/**
 * Leaderboard result interface
 * For current tournament leaderboard display
 */
export interface LeaderboardResult {
  tournament?: MinimalTournament;
  teamsByTour: TourGroup[];
  totalTeams: number;
  lastUpdated?: Date;
  error: string | null;
  isLoading: boolean;
}

/**
 * Tournament leaderboard result interface
 * For any tournament leaderboard with extended status info
 */
export interface TournamentLeaderboardResult {
  tournament?: Tournament;
  teamsByTour: TourGroup[];
  totalTeams?: number;
  lastUpdated?: Date;
  status: "loading" | "success" | "error" | "empty";
  tournamentStatus?: string;
  message?: string;
  error: string | null;
  isLoading: boolean;
}

// ============================================================================
// TOURNAMENT-SPECIFIC HOOK RESULTS
// ============================================================================

/**
 * Tournament hook result interface
 * Comprehensive result for all tournament navigation needs
 */
export interface TournamentHookResult {
  current: MinimalTournament | null;
  next: MinimalTournament | null;
  previous: MinimalTournament | null;
  upcoming: MinimalTournament[];
  completed: MinimalTournament[];
  all: MinimalTournament[];
  season: any | null; // Season type from Prisma
  isLoading: boolean;
  error: string | null;
}

/**
 * Tournament statistics result interface
 */
export interface TournamentStatsResult extends BaseHookResult {
  total: number;
  upcoming: number;
  current: number;
  completed: number;
  byTier: Record<string, number>;
  byCourse: Record<string, number>;
}

// ============================================================================
// TOUR CARD-SPECIFIC HOOK RESULTS
// ============================================================================

/**
 * Tour card hook result interface
 * Standard result for tour card data queries
 */
export interface TourCardHookResult {
  tourCards: EnrichedTourCard[];
  isLoading: boolean;
  error: string | null;
  count: number;
}

/**
 * Member hook result interface
 * Standard result for member data queries
 */
export interface MemberHookResult {
  members: MinimalMember[];
  isLoading: boolean;
  error: string | null;
  count: number;
}

/**
 * Tour card statistics result interface
 */
export interface TourCardStatsResult extends BaseHookResult {
  total: number;
  totalEarnings: number;
  totalPoints: number;
  averageEarnings: number;
  averagePoints: number;
  byTour: Record<string, number>;
  topEarners: EnrichedTourCard[];
}

/**
 * Member statistics result interface
 */
export interface MemberStatsResult extends BaseHookResult {
  total: number;
  withAccounts: number;
  withFriends: number;
  averageFriends: number;
  byRole: Record<string, number>;
}

// ============================================================================
// FILTER AND CONFIGURATION TYPES
// ============================================================================

/**
 * Tournament filters interface
 */
export interface TournamentFilters {
  status?: TournamentStatus | TournamentStatus[];
  tierIds?: string[];
  courseIds?: string[];
  dateRange?: { start: Date; end: Date };
  search?: string;
}

/**
 * Tour card filters interface
 */
export interface TourCardFilters {
  tourIds?: string[];
  memberIds?: string[];
  seasonIds?: string[];
  earnings?: { min?: number; max?: number };
  points?: { min?: number; max?: number };
  hasEarnings?: boolean;
  hasPosition?: boolean;
  search?: string;
}

/**
 * Member filters interface
 */
export interface MemberFilters {
  roles?: string[];
  hasAccount?: boolean;
  hasFriends?: boolean;
  search?: string;
}

// ============================================================================
// HOOK OPTIONS AND CONFIGURATIONS
// ============================================================================

/**
 * Tournament query options
 */
export interface TournamentQueryOptions {
  includeStats?: boolean;
  sortBy?: TournamentSort;
  sortDirection?: "asc" | "desc";
  limit?: number;
  filters?: TournamentFilters;
}

/**
 * Tour card query configuration
 */
export interface TourCardQueryConfig {
  includeRelations?: boolean;
  sortBy?: TourCardSort;
  sortDirection?: "asc" | "desc";
  limit?: number;
  filters?: TourCardFilters;
}

/**
 * Generic hook options
 */
export interface HookOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
}

/**
 * Performance-optimized hook options
 */
export interface OptimizedHookOptions extends HookOptions {
  memoize?: boolean;
  debounceMs?: number;
  throttleMs?: number;
}

// ============================================================================
// ENHANCED HOOK RESULT TYPES (Phase 3 Enhancement)
// ============================================================================

/**
 * Enhanced Tournament Hook Result
 * Leverages new tournament utilities for improved functionality
 */
export interface EnhancedTournamentHookResult extends TournamentHookResult {
  // Core navigation (existing)
  current: MinimalTournament | null;
  next: MinimalTournament | null;
  previous: MinimalTournament | null;
  upcoming: MinimalTournament[];
  completed: MinimalTournament[];
  all: MinimalTournament[];
  season: any | null;
  isLoading: boolean;
  error: string | null;

  // Enhanced functionality
  stats: {
    total: number;
    currentCount: number;
    upcomingCount: number;
    completedCount: number;
  };

  // Utility functions for components
  utils: {
    isLive: (tournament: MinimalTournament) => boolean;
    getByStatus: (status: TournamentStatus) => MinimalTournament[];
    sortBy: (
      field: keyof MinimalTournament,
      direction?: "asc" | "desc",
    ) => MinimalTournament[];
  };

  // Performance metadata
  meta: {
    lastUpdated: Date;
    dataSource: "store" | "api" | "server";
    cacheHit: boolean;
  };
}

/**
 * Enhanced Leaderboard Hook Result
 * Improved leaderboard data with better metadata and utilities
 */
export interface EnhancedLeaderboardResult extends LeaderboardResult {
  // Core data (existing)
  tournament: MinimalTournament | null;
  teamsByTour: TourGroup[];
  totalTeams: number;
  isLoading: boolean;
  error: string | null;

  // Enhanced data
  teams: EnrichedTeam[]; // Individual teams array
  isLive: boolean; // Whether this is a live tournament

  // Leaderboard-specific stats
  stats: {
    totalTeams: number;
    teamsByTour: number;
    averageScore?: number;
    cutLine?: number;
  };

  // Utility functions
  utils: {
    getTeamsByTour: (tourId: string) => EnrichedTeam[];
    getTeamsByPosition: (startPos: number, endPos: number) => EnrichedTeam[];
    searchTeams: (query: string) => EnrichedTeam[];
  };

  // Metadata
  meta: {
    lastUpdated: Date;
    tournamentStatus: TournamentStatus;
    dataFreshness: "fresh" | "stale" | "cached";
  };
}

/**
 * Enhanced Champions Hook Result
 * Comprehensive champions data with timing and historical context
 */
export interface EnhancedChampionsResult extends ChampionsResult {
  // Core data (existing)
  tournament: MinimalTournament | null;
  champions: EnrichedTeam[]; // Using consistent naming
  isLoading: boolean;
  error: string | null;

  // Enhanced timing data
  timing: {
    daysLimit: number;
    daysAgo: number;
    isWithinLimit: boolean;
    tournamentEndDate: Date | null;
  };

  // Champion statistics
  stats: {
    championCount: number;
    totalWinnings?: number;
    averageScore?: number;
  };

  // Historical context
  context: {
    previousChampions?: EnrichedTeam[];
    seasonChampions?: EnrichedTeam[];
  };

  // Metadata
  meta: {
    validationStatus: "valid" | "expired" | "unavailable";
    cacheStatus: "hit" | "miss" | "stale";
  };
}

/**
 * Enhanced Tour Cards Hook Result
 * Comprehensive tour card data with filtering and statistics
 */
export interface EnhancedTourCardsResult {
  // Core data
  tourCards: EnrichedTourCard[];
  isLoading: boolean;
  error: string | null;

  // Enhanced functionality
  filtered: EnrichedTourCard[]; // Currently filtered results
  total: number; // Total before filtering

  // Statistics
  stats: {
    totalEarnings: number;
    totalPoints: number;
    averageEarnings: number;
    averagePoints: number;
    topEarners: EnrichedTourCard[];
    byTour: Record<string, number>;
  };

  // Active filters
  filters: TourCardFilters;

  // Utility functions
  utils: {
    filterBy: (filters: Partial<TourCardFilters>) => EnrichedTourCard[];
    sortBy: (
      field: keyof EnrichedTourCard,
      direction?: "asc" | "desc",
    ) => EnrichedTourCard[];
    searchCards: (query: string) => EnrichedTourCard[];
    getByMember: (memberId: string) => EnrichedTourCard[];
  };

  // Performance metadata
  meta: {
    queryTime: number; // ms
    cacheHit: boolean;
    dataSource: "store" | "api" | "server";
  };
}

/**
 * Performance-Optimized Hook Result
 * Base interface for performance-conscious hooks
 */
export interface PerformanceOptimizedResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;

  // Performance metrics
  performance: {
    queryTime: number; // Time to fetch/compute data (ms)
    renderTime?: number; // Time to render (ms)
    memoryUsage?: number; // Memory footprint (bytes)
    cacheHitRate: number; // Percentage (0-100)
  };

  // Cache information
  cache: {
    status: "hit" | "miss" | "stale" | "warming";
    lastUpdated: Date;
    expiresAt: Date;
    invalidate: () => void;
  };

  // Optimization controls
  optimization: {
    memoized: boolean;
    debounced: boolean;
    throttled: boolean;
    backgroundRefresh: boolean;
  };
}

/**
 * Real-time Hook Result
 * For hooks that provide live/real-time data updates
 */
export interface RealTimeHookResult<T> extends BaseHookResult<T> {
  // Real-time status
  realTime: {
    isLive: boolean;
    lastUpdate: Date;
    updateInterval: number; // ms
    missedUpdates: number;
  };

  // Connection status
  connection: {
    status: "connected" | "connecting" | "disconnected" | "error";
    latency: number; // ms
    reconnectAttempts: number;
  };

  // Controls
  controls: {
    pause: () => void;
    resume: () => void;
    forceRefresh: () => void;
    changeInterval: (ms: number) => void;
  };
}

/**
 * Filtered and Sorted Hook Result
 * Advanced result type with built-in filtering and sorting
 */
export interface FilteredSortedResult<T, F = Record<string, any>> {
  // Data arrays
  data: T[]; // Original data
  filtered: T[]; // After filters applied
  sorted: T[]; // After sorting applied
  final: T[]; // Final result (filtered + sorted)

  // Counts
  total: number; // Original count
  filteredCount: number; // After filters
  finalCount: number; // Final result count

  // Filter state
  filters: F;
  activeFilters: Array<keyof F>;

  // Sort state
  sortBy: keyof T | null;
  sortDirection: "asc" | "desc";

  // Actions
  actions: {
    setFilters: (filters: Partial<F>) => void;
    clearFilters: () => void;
    setSorting: (field: keyof T, direction: "asc" | "desc") => void;
    clearSorting: () => void;
    reset: () => void;
  };

  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

/**
 * Tournament Navigation Result
 * Specialized result for tournament navigation components
 */
export interface TournamentNavigationResult {
  // Current context
  current: {
    tournament: MinimalTournament | null;
    isLive: boolean;
    daysRemaining?: number;
  };

  // Navigation
  navigation: {
    canGoNext: boolean;
    canGoPrevious: boolean;
    next: MinimalTournament | null;
    previous: MinimalTournament | null;
    goToNext: () => void;
    goToPrevious: () => void;
  };

  // Lists
  lists: {
    upcoming: MinimalTournament[];
    recent: MinimalTournament[];
    all: MinimalTournament[];
  };

  // Quick access
  quick: {
    nextUpcoming: MinimalTournament | null;
    lastCompleted: MinimalTournament | null;
    thisWeek: MinimalTournament[];
    thisMonth: MinimalTournament[];
  };

  // State
  isLoading: boolean;
  error: string | null;
}

/**
 * Comprehensive Hook Options
 * Extended options for enhanced hooks
 */
export interface EnhancedHookOptions extends HookOptions {
  // Performance options
  enableMemoization?: boolean;
  enableBackgroundRefresh?: boolean;
  enableRealTime?: boolean;

  // Cache options
  cacheStrategy?: "memory" | "localStorage" | "sessionStorage" | "none";
  cacheDuration?: number; // minutes

  // Optimization options
  debounceMs?: number;
  throttleMs?: number;
  batchUpdates?: boolean;

  // Data options
  includeStats?: boolean;
  includeUtils?: boolean;
  includeMeta?: boolean;

  // Error handling
  retryCount?: number;
  retryDelay?: number; // ms
  failSilently?: boolean;
}

// ============================================================================
// TYPE UTILITIES FOR ENHANCED HOOKS
// ============================================================================

/**
 * Extract data type from hook result
 */
export type ExtractHookData<T> = T extends BaseHookResult<infer U> ? U : never;

/**
 * Make hook result optional
 */
export type OptionalHookResult<T> = Partial<T> & Pick<T, "isLoading" | "error">;

/**
 * Hook result union for multiple possible states
 */
export type HookResultUnion<T> =
  | { state: "loading"; isLoading: true; error: null; data: null }
  | { state: "error"; isLoading: false; error: string; data: null }
  | { state: "success"; isLoading: false; error: null; data: T };

/**
 * Async hook result for operations that return promises
 */
export interface AsyncHookResult<T> extends BaseHookResult<T> {
  execute: (...args: any[]) => Promise<T>;
  isExecuting: boolean;
  lastExecuted: Date | null;
}

// ============================================================================
