/**
 * @file store/index.ts
 * @description Central export file for all store-related functionality
 *
 * This file re-exports all store functions, hooks, types, and utilities
 * for easier importing throughout the application.
 */

// ============= STORE =============

export { useSeasonalStore } from "./seasonalStore";

// ============= HOOKS =============

// Basic selectors
export {
  useSeason,
  useMember,
  useTourCard,
  useAllTourCards,
  useTournaments,
  useTiers,
  useTours,
  useLastLoaded,
} from "./seasonalStoreHooks";

// Advanced hooks
export {
  useCurrentTournament,
  useUpcomingTournaments,
  usePastTournaments,
  useMyTourCard,
  useTournamentsByStatus,
} from "./seasonalStoreHooks";

// ============= TYPES =============

// Core types
export type { TournamentWithCourse, SeasonalData } from "./seasonalStoreTypes";

// Selector types
export type {
  SeasonSelector,
  MemberSelector,
  TourCardSelector,
  AllTourCardsSelector,
  TournamentsSelector,
  TiersSelector,
  ToursSelector,
  LastLoadedSelector,
} from "./seasonalStoreTypes";

// Function types
export type {
  SetSeasonalDataFn,
  SetMemberFn,
  SetTourCardFn,
  SetAllTourCardsFn,
  ResetFn,
} from "./seasonalStoreTypes";

// Re-exported Prisma types
export type { Member, TourCard } from "./seasonalStoreTypes";

// ============= UTILITIES =============

export { LoadSeasonalData } from "./loadSeasonalData";
