"use client";

/**
 * Custom hook for fetching all data needed for LeaderboardView
 *
 * This hook orchestrates all the data fetching required for the leaderboard,
 * including tournament details, golfers, teams, tours, and user data.
 * It returns the data in a normalized format with loading and error states.
 *
 * @param params - Parameters for data fetching including tournament ID and optional filters
 * @returns Object containing props for LeaderboardView, loading state, error state, and refetch function
 */

import { useMemo } from "react";
import type { LeaderboardViewProps } from "../utils/types";
import { api } from "@pgc-trpcClient";

/**
 * Parameters for useLeaderboardData hook
 */
export interface LeaderboardDataParams {
  /** Tournament ID to fetch data for */
  tournamentId: string;
  /** Leaderboard variant type */
  variant?: "regular" | "playoff" | "historical";
  /** Optional tour ID to filter by */
  inputTour?: string;
  /** Optional user ID for personalization */
  userId?: string;
}

/**
 * Return type for useLeaderboardData hook
 */
export interface LeaderboardData {
  /** Props formatted for LeaderboardView component */
  props: LeaderboardViewProps | null;
  /** Whether any data is still loading */
  loading: boolean;
  /** Error message if any fetch failed */
  error: string | null;
  /** Function to refetch all data */
  refetch: () => void;
}

/**
 * Hook for fetching all leaderboard data
 */
export const useLeaderboardData = (
  params: LeaderboardDataParams,
): LeaderboardData => {
  // Fetch tournament data with all related information
  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
    refetch: refetchTournament,
  } = api.tournament.getById.useQuery(
    { tournamentId: params.tournamentId },
    { enabled: !!params.tournamentId },
  );

  // Fetch golfers for the tournament
  const {
    data: golfers,
    isLoading: golfersLoading,
    error: golfersError,
    refetch: refetchGolfers,
  } = api.golfer.getByTournament.useQuery(
    { tournamentId: params.tournamentId },
    { enabled: !!params.tournamentId },
  );

  // Fetch teams for the tournament
  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = api.team.getByTournament.useQuery(
    { tournamentId: params.tournamentId },
    { enabled: !!params.tournamentId },
  );

  // Fetch all tours
  const {
    data: tours,
    isLoading: toursLoading,
    error: toursError,
    refetch: refetchTours,
  } = api.tour.getBySeason.useQuery({ seasonId: tournament?.seasonId ?? "" });

  // Fetch tour cards for the tournament's season
  const {
    data: tourCards,
    isLoading: tourCardsLoading,
    error: tourCardsError,
    refetch: refetchTourCards,
  } = api.tourCard.getBySeason.useQuery(
    { seasonId: tournament?.seasonId ?? "" },
    { enabled: !!tournament?.seasonId },
  );

  // Fetch user data if userId is provided
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = api.member.getById.useQuery(
    { memberId: params.userId! },
    {
      enabled: !!params.userId,
      retry: false, // Don't retry if user is not found
    },
  );

  // Combine loading states
  const loading =
    tournamentLoading ||
    golfersLoading ||
    teamsLoading ||
    toursLoading ||
    tourCardsLoading ||
    userLoading;

  // Combine errors (prioritize tournament error as it's most critical)
  const error =
    tournamentError?.message ??
    golfersError?.message ??
    teamsError?.message ??
    toursError?.message ??
    tourCardsError?.message ??
    userError?.message ??
    null;

  // Transform data to match expected LeaderboardViewProps format
  const props = useMemo((): LeaderboardViewProps | null => {
    if (!tournament || !golfers || !teams || !tours) {
      return null;
    }

    return {
      variant: params.variant ?? "regular",
      tournament: {
        ...tournament,
        course: tournament.course ?? null,
      },
      tours: tours ?? [],
      actualTours: tours ?? [],
      tourCard: tourCards?.find((a) => a.memberId === user?.id) ?? null,
      member: user ?? null,
      golfers: golfers ?? [],
      teams: teams ?? [],
      tourCards: tourCards ?? [],
      inputTour: params.inputTour,
    };
  }, [
    tournament,
    golfers,
    teams,
    tours,
    tourCards,
    user,
    params.variant,
    params.inputTour,
  ]);

  // Refetch function to refresh all data
  const refetch = () => {
    void refetchTournament();
    void refetchGolfers();
    void refetchTeams();
    void refetchTours();
    void refetchTourCards();
    if (params.userId) {
      void refetchUser();
    }
  };

  return {
    props,
    loading,
    error,
    refetch,
  };
};
