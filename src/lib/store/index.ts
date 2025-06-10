/**
 * Main entry point for the new store architecture
 *
 * This file exports all store components, hooks, and utilities
 * for easy import throughout the application.
 */

// Store Providers
export { StoreProvider, queryClient } from "./providers/StoreProvider";

// Store Error Handling
export {
  StoreErrorBoundary,
  useStoreErrorHandler,
  createStoreError,
  STORE_ERROR_CODES,
} from "./utils/error-handling";

// Migration Utilities
export {
  FEATURE_FLAGS,
  useNewStoreArchitecture,
  StoreMigration,
  StorageKeyMigration,
  useGradualMigration,
  initializeStoreMigration,
} from "./utils/migration";

// Type Definitions
export type {
  Tournament,
  Course,
  Hole,
  WeatherConditions,
  TournamentMetadata,
  Golfer,
  Round,
  HoleScore,
  GolferStats,
  LeaderboardEntry,
  Team,
  UserProfile,
  UserPreferences,
  UserStats,
  TournamentState,
  LeaderboardState,
  UserState,
  UIState,
  ApiResponse,
  PaginatedResponse,
  UseTournamentDataReturn,
  UseLeaderboardDataReturn,
  UseUserDataReturn,
  UseUIStateReturn,
  StoreError,
  StoreEvent,
  LeaderboardUpdateEvent,
  TournamentStatusEvent,
  LoadingState,
  SortableFields,
  FilterableFields,
  StoreActions,
} from "./types";

export { QUERY_KEYS } from "./types";

// Domain Stores (direct access if needed)
export { useTournamentStore } from "./domains/tournament/store";
export { useLeaderboardStore } from "./domains/leaderboard/store";
export { useUserStore } from "./domains/user/store";
export { useUIStore } from "./domains/ui/store";

// Services
export { TournamentService } from "./services/tournament.service";
export { LeaderboardService } from "./services/leaderboard.service";

// Integration Hooks (recommended way to use stores)
export {
  useTournamentData,
  useTournamentById,
  useActiveTournament,
  useUpcomingTournaments,
  usePastTournaments,
} from "./hooks/useTournamentData";

export {
  useLeaderboardData,
  useTeamsData,
  useGolferById,
  useTeamById,
} from "./hooks/useLeaderboardData";

export {
  useUserData,
  useUserProfile,
  useUserTeams,
  useUserPreferences,
} from "./hooks/useUserData";

export {
  useUIState,
  useSelectedGolfer,
  useSelectedTeam,
  useFilters,
  useSorting,
} from "./hooks/useUIState";

export {
  useTournamentPage,
  useTournamentPageData,
  useTournamentPageActions,
} from "./hooks/useTournamentPage";

/**
 * Convenience hook that provides access to all stores
 * Use this for debugging or when you need direct access to multiple stores
 */
export function useAllStores() {
  const tournamentStore = useTournamentStore();
  const leaderboardStore = useLeaderboardStore();
  const userStore = useUserStore();
  const uiStore = useUIStore();

  return {
    tournament: tournamentStore,
    leaderboard: leaderboardStore,
    user: userStore,
    ui: uiStore,
  };
}

/**
 * Store architecture version and metadata
 */
export const STORE_METADATA = {
  version: "1.0.0",
  architecture: "domain-driven",
  framework: "zustand + react-query",
  features: [
    "domain-separated stores",
    "react-query integration",
    "automatic caching",
    "real-time updates",
    "error boundaries",
    "migration utilities",
    "typescript support",
  ],
} as const;
