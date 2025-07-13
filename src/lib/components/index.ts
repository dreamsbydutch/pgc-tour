// Barrel export for all components in src/lib/components
export { default as ServiceWorkerRegistration } from "./pwa/ServiceWorkerRegistration";
export { default as InstallPWAButton, useInstallPWA } from "./pwa/InstallPWA";

export {
  CreateGroupsButton,
  UpdateGolfersButton,
  UpdateTeamsButton,
  EmailListLinkButton,
  HistoryButton,
} from "./functional/AdminButtons";
export { ChampionsPopup } from "./functional/ChampionsPopup";

export { Icons } from "./functional/Icons";
export { LeaderboardHeader } from "./functional/LeaderboardHeader";
export { LeagueSchedule } from "./functional/LeagueSchedule";
export { default as LittleFucker } from "./functional/LittleFucker";
export { PayoutsTable, PointsTable } from "./functional/TierTables";
export { TournamentCountdown } from "./functional/TournamentCountdown";
export { ToursToggleButton } from "./functional/ToursToggle";

/**
 * HomePageListings - Single point of entry for home page listings functionality
 */

// Main component - primary export
export { HomePageListingsContainer } from "./HomePageListings/main";

// Re-export types for external consumers
export type {
  HomePageListingsViewType,
  HomePageListingsContainerProps,
  HomePageListingsUser,
  HomePageListingsTour,
  HomePageListingsChampion,
  HomePageListingsTeam,
  HomePageListingsTourCard,
} from "./HomePageListings/utils/types";

/**
 * LeaderboardView - Single point of entry for leaderboard functionality
 */

// Main component - primary export
export { LeaderboardView } from "./LeaderboardView/main";

/**
 * Navigation - Single point of entry for navigation functionality
 */

// Main components - primary exports
export { NavigationProvider } from "./Navigation/main";
