/**
 * Types for the seasonal golf tournament store.
 *
 * Centralizes all types used by the Zustand seasonal store for clarity and IntelliSense.
 *
 * @module seasonalStoreTypes
 */
import type {
  Course,
  Member,
  Season,
  Tier,
  Tour,
  TourCard,
  Tournament,
} from "@prisma/client";

/**
 * Tournament with included course object.
 */
export type TournamentWithCourse = Tournament & { course: Course };

/**
 * Store shape for all seasonal golf data.
 */
export interface SeasonalData {
  /** Current season object (static for the session) */
  season: Season | null;
  /** Current signed-in member (can change if user updates profile) */
  member: Member | null;
  /** Current user's tour card for the season (can change if user updates info) */
  tourCard: TourCard | null;
  /** All tour cards for the current season (can be refreshed if friends change) */
  allTourCards: TourCard[] | null;
  /** All tournaments for the season, each with its course (static for the session) */
  tournaments: TournamentWithCourse[] | null;
  /** All tiers for the season (static for the session) */
  tiers: Tier[] | null;
  /** All tours for the season (static for the session) */
  tours: Tour[] | null;
  /** Timestamp of last data load */
  lastLoaded: number | null;
  /**
   * Set static seasonal data (season, tournaments, tiers, tours) on initial load.
   * @param data Object with static data to set
   */
  setSeasonalData: (
    data: Pick<SeasonalData, "season" | "tournaments" | "tiers" | "tours">,
  ) => void;
  /**
   * Update the current member object (e.g., after profile update).
   * @param member New member object
   */
  setMember: (member: Member) => void;
  /**
   * Update the current user's tour card (e.g., after info update).
   * @param tourCard New tour card object
   */
  setTourCard: (tourCard: TourCard) => void;
  /**
   * Update all tour cards (e.g., after adding/removing friends).
   * @param tourCards New array of tour cards
   */
  setAllTourCards: (tourCards: TourCard[]) => void;
  /**
   * Reset all seasonal data to null (e.g., on logout).
   */
  reset: () => void;
}

/**
 * Return type for useSeasonalStore selector hooks.
 *
 * Example: useSeasonalStore((s) => s.season) returns Season | null
 */
export type SeasonSelector = Season | null;
export type MemberSelector = Member | null;
export type TourCardSelector = TourCard | null;
export type AllTourCardsSelector = TourCard[] | null;
export type TournamentsSelector = TournamentWithCourse[] | null;
export type TiersSelector = Tier[] | null;
export type ToursSelector = Tour[] | null;
export type LastLoadedSelector = number | null;

/**
 * Return type for setSeasonalData hook.
 */
export type SetSeasonalDataFn = (
  data: Pick<SeasonalData, "season" | "tournaments" | "tiers" | "tours">,
) => void;

/**
 * Return type for setMember hook.
 */
export type SetMemberFn = (member: Member) => void;

/**
 * Return type for setTourCard hook.
 */
export type SetTourCardFn = (tourCard: TourCard) => void;

/**
 * Return type for setAllTourCards hook.
 */
export type SetAllTourCardsFn = (tourCards: TourCard[]) => void;

/**
 * Return type for reset hook.
 */
export type ResetFn = () => void;

// Add re-exports for Member and TourCard from @prisma/client for use in hooks typing
export type { Member, TourCard } from "@prisma/client";
