/**
 * @file hooks.ts
 * @description
 *   Centralized exports and implementations for core seasonal golf tournament hooks.
 *   Includes user/session access, champion queries, trophy queries, course data, and toast notifications.
 *   All hooks and types are fully documented for IntelliSense, maintainability, and type safety.
 *
 *   Usage:
 *     - useUser(): Auth/session/member access
 *     - useRecentChampions(), useChampionsByTournamentId(): Champion queries
 *     - useChampionTrophies(): Major trophy queries
 *     - useCourseData(): Live course data from DataGolf
 *     - useToast(), toast(): Toast notification system
 */

import { useHeaderUser } from "../providers/AuthProvider";
import { useSeasonalStore } from "../store/seasonalStore";
import { api } from "@/trpc/react";
import {
  useTournaments,
  useAllTourCards,
  useMember,
  useSeason,
  useTours,
  useTiers,
} from "../store/seasonalStoreHooks";
import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { DatagolfCourseInputData } from "@/lib/types/datagolf_types";
import { fetchDataGolf } from "../utils/main";

// ===================== useUser =====================
/**
 * useUser
 * Returns the current authenticated user (from headers), and the seasonal member profile.
 * @returns { user, member }
 */
export function useUser() {
  const { user, member } = useHeaderUser();
  return {
    user,
    member,
  };
}

// ===================== useRecentChampions & useChampionsByTournamentId =====================
/**
 * useRecentChampions
 * Returns the champion teams (position "1" or "T1") of the most recent completed tournament
 * if it ended within the last 3 days. Each champion includes the full team and attached tourCard.
 * @returns { tournament, champions, isLoading, error }
 */
export function useRecentChampions() {
  const tournaments = useTournaments();
  const allTourCards = useAllTourCards();
  const recentTournament = useMemo(() => {
    if (!tournaments) return null;
    const now = new Date();
    return (
      tournaments
        .filter((t) => t.endDate < now)
        .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0] ?? null
    );
  }, [tournaments]);
  const isWithin = useMemo(() => {
    if (!recentTournament) return false;
    const now = new Date();
    const end = new Date(recentTournament.endDate);
    const diff = (now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  }, [recentTournament]);
  const {
    data: teams,
    isLoading,
    error,
  } = api.team.getChampionsByTournament.useQuery(
    { tournamentId: recentTournament?.id ?? "" },
    { enabled: !!recentTournament && isWithin },
  );
  const champions = useMemo(() => {
    if (!teams || !allTourCards) return [];
    return teams
      .filter((team) => team.position === "1" || team.position === "T1")
      .map((team) => ({
        ...team,
        tourCard: allTourCards.find((tc) => tc.id === team.tourCardId) ?? null,
      }));
  }, [teams, allTourCards]);
  return {
    tournament: recentTournament,
    champions,
    isLoading,
    error,
  };
}

/**
 * useChampionsByTournamentId
 * Returns the champion teams (position "1" or "T1") for a given tournamentId.
 * Each champion includes the full team and attached tourCard.
 * @param tournamentId - The id of the tournament to get champions for
 * @returns { champions, isLoading, error }
 */
export function useChampionsByTournamentId(tournamentId: string | undefined) {
  const allTourCards = useAllTourCards();
  const {
    data: teams,
    isLoading,
    error,
  } = api.team.getChampionsByTournament.useQuery(
    { tournamentId: tournamentId ?? "" },
    { enabled: !!tournamentId },
  );
  const champions = useMemo(() => {
    if (!teams || !allTourCards) return [];
    return teams
      .filter((team) => team.position === "1" || team.position === "T1")
      .map((team) => ({
        ...team,
        tourCard: allTourCards.find((tc) => tc.id === team.tourCardId) ?? null,
      }));
  }, [teams, allTourCards]);
  return {
    champions,
    isLoading,
    error,
  };
}

// ===================== useChampionTrophies =====================
/**
 * Props for useChampionTrophies hook.
 */
export interface UseChampionTrophiesProps {
  /** The member's unique id */
  memberId: string;
  /** Optional season id to filter trophies by season */
  seasonId?: string;
}
/**
 * Represents a single championship trophy (winning team in a major or special tournament).
 */
export interface ChampionTrophy {
  id: number;
  tournamentId: string;
  position: string | null;
  tournament?: {
    id: string;
    name: string;
    logoUrl: string | null;
    startDate: Date;
    seasonId: string;
    tierId: string;
  };
  tier?: {
    id: string;
    name: string;
    payouts: number[];
  };
}
/**
 * Return type for useChampionTrophies hook.
 */
export interface UseChampionTrophiesReturn {
  /** Array of major championship trophies for the member */
  championTrophies: ChampionTrophy[];
  /** True if loading data */
  isLoading: boolean;
  /** True if season text should be shown (no seasonId filter) */
  showSeasonText: boolean;
  /** True if large size display should be used (seasonId filter present) */
  isLargeSize: boolean;
}
/**
 * useChampionTrophies
 *
 * Returns a member's major championship trophies (winning teams in "Major" tier or special tournaments),
 * optionally filtered by season. Handles loading state, display flags, and sorts trophies by payout value.
 *
 * @param props - { memberId, seasonId? }
 * @returns Champion trophies, loading state, and display flags
 *
 * @example
 *   const { championTrophies, isLoading } = useChampionTrophies({ memberId, seasonId });
 *   championTrophies.forEach(trophy => ...);
 */
export function useChampionTrophies({
  memberId,
  seasonId,
}: UseChampionTrophiesProps): UseChampionTrophiesReturn {
  const { data: teams, isLoading: teamsLoading } =
    api.team.getByMember.useQuery(
      { memberId },
      {
        enabled: !!memberId,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 2,
        retry: 3,
      },
    );
  const { data: tiers, isLoading: tiersLoading } = api.tier.getAll.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 2,
      retry: 3,
    },
  );
  const championTrophiesData = useMemo<{
    championTrophies: ChampionTrophy[];
    showSeasonText: boolean;
    isLargeSize: boolean;
  }>(() => {
    if (!teams || !tiers) {
      return {
        championTrophies: [],
        showSeasonText: seasonId === undefined,
        isLargeSize: seasonId !== undefined,
      };
    }
    let filteredTeams = teams.filter(
      (t) => t.position?.replace("T", "") === "1",
    );
    if (seasonId) {
      filteredTeams = filteredTeams.filter(
        (t) => t.tournament?.seasonId === seasonId,
      );
    }
    const championTrophies = filteredTeams
      .map((t) => ({
        ...t,
        tier: tiers.find((tier) => tier.id === t.tournament?.tierId),
      }))
      .filter(
        ({ tournament, tier }) =>
          tournament &&
          (tier?.name === "Major" ||
            [
              "Canadian Open",
              "RBC Canadian Open",
              "TOUR Championship",
            ].includes(tournament.name)),
      )
      .sort((a, b) => (b.tier?.payouts[0] ?? 0) - (a.tier?.payouts[0] ?? 0));
    return {
      championTrophies,
      showSeasonText: seasonId === undefined,
      isLargeSize: seasonId !== undefined,
    };
  }, [teams, tiers, seasonId]);
  return {
    ...championTrophiesData,
    isLoading: teamsLoading || tiersLoading,
  };
}

// ===================== useCourseData =====================
/**
 * useCourseData
 *
 * Fetches live course data from the DataGolf API ("preds/live-hole-stats") using React Query.
 *
 * @param enabled - If true, fetches data; if false, disables fetching (default: true)
 * @returns React Query result with course data, loading, and error states
 *
 * @example
 *   const { data, isLoading, error } = useCourseData();
 *   if (data) { ... }
 */
export function useCourseData(
  enabled = true,
): UseQueryResult<DatagolfCourseInputData, unknown> {
  return useQuery<DatagolfCourseInputData, unknown>({
    queryKey: ["course-data"],
    queryFn: async () => {
      const data = await fetchDataGolf("preds/live-hole-stats", {}) as DatagolfCourseInputData
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ===================== useCurrentSchedule =====================
/**
 * useCurrentSchedule
 *
 * Returns all tournaments from the current season, with tier attached to each tournament.
 * Uses only the seasonal store for all data (tournaments, tiers, season).
 * Assumes each tournament already has its course attached.
 *
 * @returns {
 *   tournaments: Array<Tournament & { course: Course; tier: Tier }>;
 *   isLoading: boolean;
 *   error: unknown;
 * }
 *
 * @example
 *   const { tournaments, isLoading } = useCurrentSchedule();
 *   tournaments.forEach(t => ...);
 */
export function useCurrentSchedule() {
  // Get all data from the store
  const tournaments = useTournaments();
  const tiers = useSeasonalStore((s) => s.tiers);
  const season = useSeasonalStore((s) => s.season);

  // Find the current season id
  const currentSeasonId = season?.id;

  // Filter tournaments for current season
  const currentSeasonTournaments =
    tournaments?.filter((t) => t.seasonId === currentSeasonId) ?? [];

  // Attach tier to each tournament (course is already attached)
  const tournamentsWithDetails = currentSeasonTournaments
    .map((t) => {
      const tier = tiers?.find((tier) => tier.id === t.tierId);
      if (!tier) return null; // Exclude tournaments with missing tier
      // Ensure startDate and endDate are Date objects
      const startDate =
        t.startDate instanceof Date ? t.startDate : new Date(t.startDate);
      const endDate =
        t.endDate instanceof Date ? t.endDate : new Date(t.endDate);
      return { ...t, startDate, endDate, tier };
    })
    .filter(
      (t): t is typeof t & { tier: NonNullable<typeof t>["tier"] } => !!t,
    );

  const isLoading = !tournaments || !tiers || !season;
  const error = undefined; // Could be extended to handle store errors
  return {
    tournaments: tournamentsWithDetails,
    isLoading,
    error,
  };
}

export function useCurrentStandings() {
  const currentMember = useMember();
  const season = useSeason();
  const seasonId = season?.id;
  const tournaments = useTournaments();
  const tourCards = useAllTourCards();
  const tours = useTours();
  const tiers = useTiers();
  const currentTourCard = useMemo(() => {
    if (!tourCards || !currentMember) return null;
    return tourCards.find((tc) => tc.memberId === currentMember.id);
  }, [tourCards, currentMember]);

  // Get all teams for all tournaments in the current season
  const tournamentIds = useMemo(
    () =>
      tournaments?.filter((t) => t.seasonId === seasonId).map((t) => t.id) ??
      [],
    [tournaments, seasonId],
  );
  const allTeams = api.team.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const teams = useMemo(
    () =>
      allTeams.data?.filter((team) =>
        tournamentIds.includes(team.tournamentId),
      ) ?? [],
    [allTeams.data, tournamentIds],
  );

  const isLoading = allTeams.isLoading || !tours || !tourCards || !seasonId;
  const error = allTeams.error;

  return {
    teams,
    tours,
    tiers,
    tourCards,
    currentTourCard,
    currentMember,
    tournaments: tournaments?.filter((t) => t.seasonId === seasonId) ?? [],
    seasonId,
    isLoading,
    error,
  };
}
