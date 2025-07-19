/**
 * TypeScript type definitions for StandingsView component
 *
 * This file contains all types used throughout the StandingsView component,
 * including extended types with computed properties, component prop types,
 * and data structures for different standings variants.
 */

import type {
  TourCard,
  Tour,
  Tier,
  Member,
  Team,
  Tournament,
} from "@prisma/client";

// ================= EXTENDED PRISMA TYPES =================

/**
 * Extended TourCard with computed properties for standings display
 */
export interface ExtendedTourCard extends TourCard {
  /** Previous points total (for change calculation) */
  pastPoints?: number;
  /** Position change from previous period */
  posChange?: number;
  /** Position change for playoff qualification */
  posChangePO?: number;
}

/**
 * Tour with associated tour cards
 */
export interface TourWithCards extends Tour {
  /** Tour cards associated with this tour */
  tourCards?: ExtendedTourCard[];
}

// ================= DATA STRUCTURES =================

/**
 * Complete standings data structure returned from hooks
 */
export interface StandingsData {
  /** All available tours */
  tours: Tour[];
  /** All tier information */
  tiers: Tier[];
  /** All tour cards with computed properties */
  tourCards: ExtendedTourCard[];
  /** Current user's tour card */
  currentTourCard: ExtendedTourCard | null;
  /** Current user's member information */
  currentMember: Member | null;
  /** All teams for the season */
  teams: Team[];
  /** All tournaments for the season */
  tournaments: Tournament[];
  /** Current season ID */
  seasonId: string;
}

/**
 * Standings state with loading and error handling
 */
export interface StandingsState {
  /** Data payload (null when loading or error) */
  data: StandingsData | null;
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Error object if fetch failed */
  error: Error | null;
}

// ================= FRIEND MANAGEMENT =================

/**
 * State for friend management operations
 */
export interface FriendManagementState {
  /** Set of member IDs currently being updated */
  friendChangingIds: Set<string>;
  /** Whether any friend operation is in progress */
  isUpdating: boolean;
}

/**
 * Actions for friend management
 */
export interface FriendManagementActions {
  /** Add a friend by member ID */
  addFriend: (memberId: string) => Promise<void>;
  /** Remove a friend by member ID */
  removeFriend: (memberId: string) => Promise<void>;
}

/**
 * Complete friend management hook return
 */
export interface FriendManagementHook {
  /** Current friend management state */
  state: FriendManagementState;
  /** Available friend management actions */
  actions: FriendManagementActions;
}

// ================= COMPONENT PROPS =================

/**
 * Props for the main StandingsView component
 */
export interface StandingsViewProps {
  /** Optional initial tour ID to display */
  initialTourId?: string;
}

/**
 * Props for StandingsContent component
 */
export interface StandingsContentProps {
  /** Currently selected tour toggle */
  standingsToggle: string;
  /** Complete standings data */
  data: StandingsData;
  /** Friend management state */
  friendState: FriendManagementState;
  /** Function to add a friend */
  onAddFriend: (memberId: string) => Promise<void>;
  /** Function to remove a friend */
  onRemoveFriend: (memberId: string) => Promise<void>;
}

/**
 * Props for TourStandings component (regular tour display)
 */
export interface TourStandingsProps {
  /** Tour information */
  tour: Tour;
  /** Tour cards to display */
  tourCards: ExtendedTourCard[];
  /** Current user's member info */
  currentMember: Member | null;
  /** Friend management state */
  friendState: FriendManagementState;
  /** Function to add a friend */
  onAddFriend: (memberId: string) => Promise<void>;
  /** Function to remove a friend */
  onRemoveFriend: (memberId: string) => Promise<void>;
}

/**
 * Props for PlayoffStandings component
 */
export interface PlayoffStandingsProps {
  /** All available tours */
  tours: Tour[];
  /** Tier information for grouping */
  tiers: Tier[];
  /** Tour cards to display */
  tourCards: ExtendedTourCard[];
  /** Current user's member info */
  currentMember: Member | null;
  /** Friend management state */
  friendState: FriendManagementState;
  /** Function to add a friend */
  onAddFriend: (memberId: string) => Promise<void>;
  /** Function to remove a friend */
  onRemoveFriend: (memberId: string) => Promise<void>;
}

/**
 * Props for individual StandingsListing component
 */
export interface StandingsListingProps {
  /** Tour card to display */
  tourCard: ExtendedTourCard;
  /** Display variant */
  variant: "regular" | "playoff" | "bumped";
  /** Current user's member info */
  currentMember?: Member | null;
  /** Whether this friend is currently being updated */
  isFriendChanging?: boolean;
  /** Function to add a friend */
  onAddFriend?: (memberId: string) => void;
  /** Function to remove a friend */
  onRemoveFriend?: (memberId: string) => void;

  // Additional props for playoff variant
  /** Team information for playoff display */
  teams?: ExtendedTourCard[];
  /** Stroke information */
  strokes?: number[];
  /** Tour information */
  tour?: Tour;
}

/**
 * Props for StandingsHeader component
 */
export interface StandingsHeaderProps {
  /** Currently selected tour toggle */
  standingsToggle: string;
  /** Currently displayed tour info */
  displayedTour?: Tour;
}

/**
 * Props for ToursToggle component
 */
export interface ToursToggleProps {
  /** Available tours to toggle between */
  tours: Tour[];
  /** Currently selected tour */
  standingsToggle: string;
  /** Function to change tour selection */
  setStandingsToggle: (tourId: string) => void;
}

/**
 * Props for StandingsError component
 */
export interface StandingsErrorProps {
  /** Error message to display */
  error: string;
  /** Function to retry loading */
  onRetry: () => void;
}

// ================= UTILITY RETURN TYPES =================

/**
 * Grouped standings for regular tour view
 */
export interface StandingsGroups {
  /** Tour cards qualified for gold playoffs (positions 1-15) */
  goldCutCards: ExtendedTourCard[];
  /** Tour cards qualified for silver playoffs (positions 16-35) */
  silverCutCards: ExtendedTourCard[];
  /** Remaining tour cards (positions 36+) */
  remainingCards: ExtendedTourCard[];
}

/**
 * Grouped standings for playoff view
 */
export interface PlayoffGroups {
  /** Teams qualified for gold playoffs */
  goldTeams: ExtendedTourCard[];
  /** Teams qualified for silver playoffs */
  silverTeams: ExtendedTourCard[];
  /** Teams that were bumped into playoffs */
  bumpedTeams: ExtendedTourCard[];
}

// ================= HOOK RETURN TYPES =================

/**
 * Return type for useStandingsData hook
 */
export interface UseStandingsDataReturn extends StandingsState {}

/**
 * Return type for useFriendManagement hook
 */
export interface UseFriendManagementReturn extends FriendManagementHook {}

// Re-export Prisma types for convenience
export type {
  TourCard,
  Tour,
  Tier,
  Member,
  Team,
  Tournament,
} from "@prisma/client";
