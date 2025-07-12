"use client";

/**
 * Hook for fetching all data needed for LeaderboardView using tRPC
 * Returns data in the format expected by the existing LeaderboardView component
 */

import { useMemo } from "react";
import { api } from "@/trpc/react";
import type { LeaderboardViewProps } from "../types";

export interface LeaderboardDataParams {
  tournamentId: string;
  variant?: "regular" | "playoff" | "historical";
  inputTour?: string;
  userId?: string;
}

export interface LeaderboardData {
  props: LeaderboardViewProps | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

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
