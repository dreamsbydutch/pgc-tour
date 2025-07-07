/**
 * Entity Types
 *
 * Centralized type definitions for all entity types used across hooks.
 * These types represent the minimal data structures needed for efficient
 * hook operations while maintaining type safety.
 *
 * @fileoverview Minimal entity type definitions
 */

import type {
  Tournament,
  Team,
  Tour,
  TourCard,
  Golfer,
  Member,
} from "@prisma/client";

/**
 * Base team structure for team processing utilities
 * Represents the minimal required properties for team operations
 */
export type BaseTeam = {
  id: string;
  name?: string;
  [key: string]: unknown;
};

/**
 * Team enriched with related data
 * Generic type for teams that have been enhanced with relationships
 */
export type TeamWithRelations<
  T extends BaseTeam = BaseTeam,
  R extends Record<string, unknown> = Record<string, unknown>,
> = T & R;

// ============================================================================
// MINIMAL ENTITY TYPES
// ============================================================================

/**
 * Minimal tour type with essential properties
 * Used for efficient data transfer in hooks
 */
export type MinimalTour = {
  id: string;
  name: string;
  logoUrl: string;
  buyIn: number;
  shortForm: string;
  seasonId: string;
};

/**
 * Minimal tour card type with essential properties
 * Used for efficient data transfer in hooks
 */
export type MinimalTourCard = {
  id: string;
  memberId: string;
  tourId: string;
  seasonId: string;
  displayName: string;
  earnings: number;
  points: number;
  position: string | null;
  win?: number;
  topTen?: number;
  madeCut?: number;
  appearances?: number;
  playoff?: number;
};

/**
 * Minimal tournament type with essential properties and relations
 * Used for efficient data transfer in hooks
 */
export type MinimalTournament = {
  id: string;
  name: string;
  logoUrl: string | null;
  startDate: Date;
  endDate: Date;
  livePlay: boolean | null;
  currentRound: number | null;
  season: {
    id: string;
    year: number;
  };
  course: {
    id: string;
    name: string;
    location: string;
    par: number;
    front: number;
    back: number;
    apiId: string;
  };
  tier: {
    id: string;
    name: string;
    points: number[];
    payouts: number[];
    seasonId: string;
  };
};

/**
 * Minimal member type with essential properties
 * Used for efficient data transfer in hooks
 */
export type MinimalMember = Pick<
  Member,
  "id" | "firstname" | "lastname" | "email" | "role" | "account" | "friends"
>;

/**
 * Minimal season type
 * Used for efficient data transfer in hooks
 */
export type MinimalSeason = {
  id: string;
  year: number;
  number: number;
};

// ============================================================================
// ENRICHED ENTITY TYPES
// ============================================================================

/**
 * Enriched team type with tour and tour card relations
 * Used in team processing hooks
 */
export interface EnrichedTeam extends Team {
  tour: MinimalTour;
  tourCard: MinimalTourCard;
  golfers?: Golfer[];
}

/**
 * Enriched tour card type with tour, member, and season relations
 * Used in tour card processing hooks
 */
export type EnrichedTourCard = MinimalTourCard & {
  tour: MinimalTour;
  member: MinimalMember;
  season: MinimalSeason;
};

/**
 * Tour group type for grouping teams by tour
 * Used in team grouping operations
 */
export interface TourGroup {
  tour: MinimalTour;
  teams: EnrichedTeam[];
  teamCount: number;
}

// ============================================================================
// ENUM-LIKE TYPES
// ============================================================================

/**
 * Tournament status type
 * Used for filtering and status-based operations
 */
export type TournamentStatus = "upcoming" | "current" | "completed";

/**
 * Tournament sort options
 * Used for sorting operations in tournament hooks
 */
export type TournamentSort = "startDate" | "endDate" | "name" | "tier";

/**
 * Tour card sort options
 * Used for sorting operations in tour card hooks
 */
export type TourCardSort =
  | "earnings"
  | "points"
  | "position"
  | "displayName"
  | "appearances"
  | "win"
  | "topTen";

/**
 * Member sort options
 * Used for sorting operations in member hooks
 */
export type MemberSort = "firstname" | "lastname" | "email" | "role";

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Sort configuration for any entity
 * Generic sort configuration used across hooks
 */
export interface SortConfig<T> {
  key: keyof T;
  direction: "asc" | "desc";
}

/**
 * Filter configuration for any entity
 * Generic filter configuration used across hooks
 */
export interface FilterConfig<T> {
  field: keyof T;
  value: any;
  operator?: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "includes";
}

/**
 * Range filter type
 * Used for numeric and date range filtering
 */
export interface RangeFilter<T = number> {
  min?: T;
  max?: T;
}

/**
 * Date range filter type
 * Used for date range filtering
 */
export interface DateRangeFilter {
  start?: Date;
  end?: Date;
}

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

/**
 * Relationship configuration for entity enrichment
 * Used in data enhancement utilities
 */
export interface RelationshipConfig {
  entities: any[];
  baseKey: string;
  relatedKey: string;
  propertyName: string;
  required?: boolean;
  multiple?: boolean;
}

/**
 * Entity with relationships
 * Base type for entities that can be enriched with relationships
 */
export interface EntityWithRelations {
  id: string;
  [key: string]: any;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result type
 * Used in validation utilities
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * Data validation configuration
 * Used for validating required datasets
 */
export interface DataValidationConfig {
  name: string;
  data: any[];
  required?: boolean;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Base statistics interface
 * Common statistics pattern used across hooks
 */
export interface BaseStats {
  total: number;
}

/**
 * Numeric statistics interface
 * Used for numeric aggregations
 */
export interface NumericStats {
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Tournament statistics interface
 * Used in tournament statistics hooks
 */
export interface TournamentStats extends BaseStats {
  upcoming: number;
  current: number;
  completed: number;
  byTier: Record<string, number>;
  byCourse: Record<string, number>;
}

/**
 * Tour card statistics interface
 * Used in tour card statistics hooks
 */
export interface TourCardStats extends BaseStats {
  totalEarnings: number;
  totalPoints: number;
  averageEarnings: number;
  averagePoints: number;
  byTour: Record<string, number>;
}

/**
 * Member statistics interface
 * Used in member statistics hooks
 */
export interface MemberStats extends BaseStats {
  withAccounts: number;
  withFriends: number;
  averageFriends: number;
  byRole: Record<string, number>;
}
