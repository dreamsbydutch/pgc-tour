/**
 * Navigation data hook
 * Optimized to use existing auth context and minimize API calls
 */

import { useMemo } from "react";
import type { NavigationData } from "../types";
import { useHeaderUser } from "@pgc-auth";
import { api } from "@pgc-trpcClient";

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

/**
 * Custom hook for navigation data
 * Uses existing auth context and optimized API calls
 */
export function useNavigationData(): NavigationData {
  const { user, member, isLoading: isAuthLoading } = useHeaderUser();

  // Only fetch data if we have a member and not loading auth
  const shouldFetch = !!member?.id && !isAuthLoading;

  // Fetch tour cards with optimized caching
  const { data: tourCards, isLoading: isTourCardsLoading } =
    api.tourCard.getByMember.useQuery(
      { memberId: member?.id ?? "" },
      {
        enabled: shouldFetch,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    );

  // Fetch teams with optimized caching
  const { data: teams, isLoading: isTeamsLoading } =
    api.team.getByMember.useQuery(
      { memberId: member?.id ?? "" },
      {
        enabled: shouldFetch,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    );

  // Memoize champions calculation to prevent unnecessary recalculations
  const champions = useMemo(() => {
    if (!teams) return [];

    return teams
      .filter((team) => {
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
  }, [teams]);

  const isLoading = isAuthLoading;
  const tourCardLoading = shouldFetch && (isTourCardsLoading || isTeamsLoading);

  return {
    user,
    member,
    tourCards: tourCards ?? [],
    champions,
    isLoading,
    tourCardLoading,
  };
}
