/**
 * useChampionTrophies Hook
 *
 * Manages championship trophy data for a member, including filtering
 * for major tournaments and championship wins.
 */

import { useMemo } from "react";
import { api } from "@/trpc/react";

interface UseChampionTrophiesProps {
  memberId: string;
  seasonId?: string;
}

interface ChampionTrophy {
  id: number;
  tournamentId: string;
  position: string | null;
  tournament:
    | {
        id: string;
        name: string;
        logoUrl: string | null;
        startDate: Date;
        seasonId: string;
        tierId: string;
      }
    | undefined;
  tier:
    | {
        id: string;
        name: string;
        payouts: number[];
      }
    | undefined;
}

interface UseChampionTrophiesReturn {
  championTrophies: ChampionTrophy[];
  isLoading: boolean;
  showSeasonText: boolean;
  isLargeSize: boolean;
}

export function useChampionTrophies({
  memberId,
  seasonId,
}: UseChampionTrophiesProps): UseChampionTrophiesReturn {
  const { data: teams, isLoading: teamsLoading } =
    api.team.getByMember.useQuery(
      { memberId },
      {
        enabled: !!memberId,
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 2, // 2 hours
        retry: 3,
      },
    );

  const { data: tiers, isLoading: tiersLoading } = api.tier.getAll.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 2, // 2 hours
      retry: 3,
    },
  );

  const championTrophiesData = useMemo(() => {
    if (!teams || !tiers) {
      return {
        championTrophies: [],
        showSeasonText: seasonId === undefined,
        isLargeSize: seasonId !== undefined,
      };
    }

    // Filter for winning teams (position "1" or "T1")
    let filteredTeams = teams.filter(
      (t) => t.position?.replace("T", "") === "1",
    );

    // Filter by seasonId if provided
    if (seasonId) {
      filteredTeams = filteredTeams.filter((t) => {
        return t.tournament?.seasonId === seasonId;
      });
    }

    // Map teams with tournament and tier data
    const championTrophies = filteredTeams
      .map((t) => {
        const tier = tiers.find((tier) => tier.id === t.tournament?.tierId);
        return {
          ...t,
          tier,
        };
      })
      .filter((team) => {
        const { tournament, tier } = team;
        // Only show Major tournaments, Canadian Open, or TOUR Championship
        return (
          tournament &&
          (tier?.name === "Major" ||
            tournament.name === "Canadian Open" ||
            tournament.name === "RBC Canadian Open" ||
            tournament.name === "TOUR Championship")
        );
      })
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
