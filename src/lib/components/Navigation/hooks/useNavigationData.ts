"use client";

/**
 * Navigation data hook
 * Optimized with error handling, retry logic, and efficient caching
 */

import { useMemo, useCallback, useRef, useEffect } from "react";
import type { NavigationData, NavigationError } from "../utils/types";
import { useHeaderUser } from "@pgc-auth";
import { api } from "@pgc-trpcClient";
import { createNavigationError, isNetworkError, getRetryDelay } from "../utils";

// Major tournament names for champion filtering
const MAJOR_TOURNAMENTS = [
  "TOUR Championship",
  "The Masters",
  "U.S. Open",
  "The Open Championship",
  "PGA Championship",
] as const;

// Tournament priority order for sorting
const TOURNAMENT_PRIORITY = {
  "TOUR Championship": 1,
  "The Masters": 2,
  "U.S. Open": 3,
  "The Open Championship": 4,
  "PGA Championship": 5,
} as const;

// Configuration constants
const CACHE_CONFIG = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 3,
  retryDelay: (attemptIndex: number) => getRetryDelay(attemptIndex),
};

const MAX_RETRY_COUNT = 3;

/**
 * Custom hook for navigation data with comprehensive error handling and optimization
 */
export function useNavigationData(): NavigationData {
  const { user, member, isLoading: isAuthLoading } = useHeaderUser();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  // Only fetch data if we have a valid member and not loading auth
  const shouldFetch = Boolean(member?.id && !isAuthLoading);

  // Fetch tour cards with enhanced error handling
  const {
    data: tourCards,
    isLoading: isTourCardsLoading,
    error: tourCardsError,
    refetch: refetchTourCards,
  } = api.tourCard.getByMember.useQuery(
    { memberId: member?.id ?? "" },
    {
      ...CACHE_CONFIG,
      enabled: shouldFetch,
    },
  );

  // Fetch teams with enhanced error handling
  const {
    data: teams,
    isLoading: isTeamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = api.team.getByMember.useQuery(
    { memberId: member?.id ?? "" },
    {
      ...CACHE_CONFIG,
      enabled: shouldFetch,
    },
  );

  // Clean up retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Log errors when they occur
  useEffect(() => {
    if (tourCardsError) {
      console.error("Tour cards fetch error:", tourCardsError);
    }
  }, [tourCardsError]);

  useEffect(() => {
    if (teamsError) {
      console.error("Teams fetch error:", teamsError);
    }
  }, [teamsError]);

  // Enhanced retry logic with exponential backoff
  const retryData = useCallback(async () => {
    if (retryCountRef.current >= MAX_RETRY_COUNT) {
      console.warn("Maximum retry attempts reached");
      return;
    }

    retryCountRef.current += 1;
    const delay = getRetryDelay(retryCountRef.current);

    // Clear existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      const executeRetry = async () => {
        try {
          console.log(
            `Retrying navigation data fetch (attempt ${retryCountRef.current})`,
          );
          await Promise.all([refetchTourCards(), refetchTeams()]);
          retryCountRef.current = 0; // Reset on success
        } catch (error) {
          console.error(
            `Retry attempt ${retryCountRef.current} failed:`,
            error,
          );
        }
      };

      void executeRetry();
    }, delay);
  }, [refetchTourCards, refetchTeams]);

  // Memoize champions calculation with error handling
  const champions = useMemo(() => {
    if (!teams || !Array.isArray(teams)) {
      return [];
    }

    try {
      return teams
        .filter((team) => {
          if (!team?.tournament?.name || !team?.position) {
            return false;
          }

          const isMajorTournament = MAJOR_TOURNAMENTS.includes(
            team.tournament.name as (typeof MAJOR_TOURNAMENTS)[number],
          );
          const isWinner = team.position === "1" || team.position === "T1";
          return isMajorTournament && isWinner;
        })
        .sort((a, b) => {
          const priorityA =
            TOURNAMENT_PRIORITY[
              a.tournament.name as keyof typeof TOURNAMENT_PRIORITY
            ] ?? 999;
          const priorityB =
            TOURNAMENT_PRIORITY[
              b.tournament.name as keyof typeof TOURNAMENT_PRIORITY
            ] ?? 999;
          return priorityA - priorityB;
        });
    } catch (error) {
      console.error("Error filtering champions:", error);
      return [];
    }
  }, [teams]);

  // Determine error state with detailed information
  const navigationError: NavigationError | null = useMemo(() => {
    const hasError = tourCardsError ?? teamsError;
    if (!hasError) return null;

    const primaryError = tourCardsError ?? teamsError;
    const isNetwork = isNetworkError(primaryError);

    // Create sync wrapper for async retry function
    const syncRetryWrapper = () => {
      void retryData();
    };

    return createNavigationError(
      isNetwork ? "NETWORK_ERROR" : "DATA_ERROR",
      isNetwork
        ? "Unable to connect to server. Please check your internet connection."
        : "Unable to load navigation data. Please try again.",
      syncRetryWrapper,
    );
  }, [tourCardsError, teamsError, retryData]);

  // Enhanced loading states
  const isLoading = isAuthLoading;
  const tourCardLoading = shouldFetch && (isTourCardsLoading || isTeamsLoading);
  const hasNetworkError = Boolean(
    navigationError && navigationError.code === "NETWORK_ERROR",
  );

  // Safely process tour cards data
  const safeTourCards = useMemo(() => {
    if (!Array.isArray(tourCards)) return [];
    return tourCards.filter((card) => card && typeof card === "object");
  }, [tourCards]);

  // Enhanced navigation data with comprehensive error handling
  return {
    user: user
      ? {
          id: user.id,
          email: user.email,
          avatar: user.avatar,
        }
      : null,
    member,
    tourCards: safeTourCards,
    champions,
    isLoading,
    tourCardLoading,
    error: navigationError,
    hasNetworkError,
    retryCount: retryCountRef.current,
  };
}
