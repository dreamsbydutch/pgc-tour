/**
 * History Module Type Definitions
 * Centralized type exports for the history module
 */

import type {
  Course,
  Golfer,
  Member,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";

/**
 * Extended Tournament type with additional properties for teams and related data
 */
export type ExtendedTournament = {
  adjustedTeams?: Team[]; // Teams with earnings/points calculated using current tiers
  teams?: Team[]; // Teams with earnings/points calculated using historical tiers
  courses?: Course[]; // Tournament courses
  golfers?: Golfer[]; // Golfers who participated
  tourCards?: TourCard[]; // Tour cards associated with the tournament
} & Tournament;

/**
 * Extended TourCard type with additional properties for performance tracking
 */
export type ExtendedTourCard = {
  teams?: (Team | undefined)[] | undefined; // Teams associated with this tour card
  adjustedTeams?: (Team | undefined)[] | undefined; // Adjusted teams for current tier values
  adjustedPoints?: number; // Total points adjusted to current tiers
  adjustedEarnings?: number; // Total earnings adjusted to current tiers
} & TourCard;

/**
 * Extended Member type with additional properties
 */
export type ExtendedMember = Member & {
  tourCards?: ExtendedTourCard[];
  teams?: Team[];
  adjustedTeams?: Team[];
};

// Additional history-specific types
export interface HistoryTableColumn {
  id: string;
  header: string;
  sortable?: boolean;
  isGroup?: boolean;
}

export interface GolferStatsColumn {
  id: string;
  header: string;
  sortable: boolean;
  isGroup: boolean;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export interface SortState {
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export interface FilterState {
  showAdjusted: boolean;
  showFriendsOnly: boolean;
}
