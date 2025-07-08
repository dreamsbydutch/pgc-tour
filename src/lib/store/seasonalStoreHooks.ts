/**
 * @fileoverview Seasonal Store React Hooks
 * Provides efficient, reusable hooks for accessing and mutating seasonal data.
 * All hooks are documented for IntelliSense and code completion.
 */

import { useSeasonalStore } from "./seasonalStore";

// ============= BASIC DATA HOOKS =============

/**
 * Returns all core seasonal data objects from the store.
 * @returns An object containing season, member, tourCard, tournaments, allTourCards, tours, and tiers.
 */
export const useSeasonalData = () =>
  useSeasonalStore((state) => ({
    season: state.season,
    member: state.member,
    tourCard: state.tourCard,
    tournaments: state.tournaments,
    allTourCards: state.allTourCards,
    tours: state.tours,
    tiers: state.tiers,
    lastLoaded: state.lastLoaded,
  }));

// ============= MUTATION HOOKS =============

/**
 * Returns all mutation functions for updating seasonal data.
 */
export const useSeasonalMutations = () =>
  useSeasonalStore((state) => ({
    setSeasonalData: state.setSeasonalData,
    setMember: state.setMember,
    setTourCard: state.setTourCard,
    setAllTourCards: state.setAllTourCards,
    reset: state.reset,
  }));

// ============= INDIVIDUAL GETTERS =============

export const useSeason = () => useSeasonalStore((state) => state.season);
export const useMember = () => useSeasonalStore((state) => state.member);
export const useTourCard = () => useSeasonalStore((state) => state.tourCard);
export const useAllTourCards = () =>
  useSeasonalStore((state) => state.allTourCards);
export const useTournaments = () =>
  useSeasonalStore((state) => state.tournaments);
export const useTiers = () => useSeasonalStore((state) => state.tiers);
export const useTours = () => useSeasonalStore((state) => state.tours);
export const useLastLoaded = () =>
  useSeasonalStore((state) => state.lastLoaded);

// ============= CONVENIENCE HOOKS =============

/**
 * Returns the current tournament (status: "current") or undefined.
 */
export function useCurrentTournament() {
  const tournaments = useTournaments();
  const now = new Date();
  return tournaments?.find((t) => t.startDate <= now && t.endDate >= now);
}

/**
 * Returns all upcoming tournaments, sorted by start date ascending.
 */
export function useUpcomingTournaments() {
  const tournaments = useTournaments();
  const now = new Date();
  return (
    tournaments
      ?.filter((t) => t.startDate > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()) ?? []
  );
}

/**
 * Returns all past tournaments, sorted by end date descending.
 */
export function usePastTournaments() {
  const tournaments = useTournaments();
  const now = new Date();
  return (
    tournaments
      ?.filter((t) => t.endDate < now)
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime()) ?? []
  );
}

/**
 * Returns the current member's tour card, or undefined if not found.
 */
export function useMyTourCard() {
  const member = useMember();
  const allTourCards = useAllTourCards();
  return member && allTourCards
    ? allTourCards.find((tc) => tc.memberId === member.id)
    : undefined;
}

// ============= DERIVED HOOKS =============

/**
 * Returns tournaments grouped by status (current, upcoming, past).
 */
export function useTournamentsByStatus() {
  const current = useCurrentTournament();
  const upcoming = useUpcomingTournaments();
  const past = usePastTournaments();
  return {
    current: current ? [current] : [],
    upcoming,
    past,
  };
}
