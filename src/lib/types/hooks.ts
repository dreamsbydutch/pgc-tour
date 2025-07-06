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
 * Standard result for tournament data queries
 */
export interface TournamentHookResult {
  tournaments: MinimalTournament[];
  isLoading: boolean;
  error: string | null;
  count: number;
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
