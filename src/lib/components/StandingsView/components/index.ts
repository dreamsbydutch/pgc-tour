/**
 * Export all components for StandingsView
 * This provides a clean API for importing consolidated components
 */

// Main content components
export { StandingsContent } from "./StandingsContent";
export { TourStandings } from "./TourStandings";
export { PlayoffStandings } from "./PlayoffStandings";

// ============================================================================
// CONSOLIDATED COMPONENT EXPORTS
// ============================================================================

// UI Components (Header, Toggle, Error, Loading)
export {
  StandingsHeader,
  ToursToggle,
  FriendsOnlyToggle,
  PointsAndPayoutsPopover,
  StandingsError,
  StandingsLoadingSkeleton,
  type StandingsHeaderProps,
  type ToursToggleProps,
  type PointsAndPayoutsPopoverProps,
  type StandingsErrorProps,
} from "./UIComponents";

// Table Components (Headers and table-related UI)
export {
  StandingsTableHeader,
  type StandingsTableHeaderProps,
  type StandingsTableHeaderVariant,
} from "./TableComponents";

// Listing Components (All standings listing variants)
export {
  StandingsListing,
  RegularStandingsListing,
  BumpedStandingsListing,
  PlayoffStandingsListing,
  PositionChange,
  type StandingsListingProps,
  type StandingsListingVariant,
} from "./ListingComponents";

// Tour Card Info Components (Player details and tournament history)
export {
  StandingsTourCardInfo,
  PlayerStats,
  TournamentHistoryRow,
  TournamentHistorySection,
  useTourCardInfoData,
  calculateAverageScore,
  getNonPlayoffTournaments,
  getTeamsForTourCard,
  renderTournamentResult,
  type UseTourCardInfoData,
} from "./TourCardInfoComponents";

// Re-export types for convenience
export type {
  StandingsContentProps,
  TourStandingsProps,
  PlayoffStandingsProps,
} from "../utils/types";
