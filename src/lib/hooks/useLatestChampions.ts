/**
 * Latest Champions Hook - Full Team Details with Golfers
 * Provides latest tournament champions with complete team and golfer information
 *
 * This hook fetches the most recent completed tournament's champions
 * with all team members and their scores for the ChampionsPopup component.
 *
 * @module useLatestChampions
 */

import { api } from "@/trpc/react";
import { useMemo } from "react";

/**
 * Hook to get the latest tournament champions with full team details
 *
 * @returns {Object} Object containing tournament and champions data with loading/error states
 */
export function useLatestChampions() {
  // Get most recent completed tournament
  const { data: tournaments = [], isLoading: tournamentsLoading } =
    api.tournament.getAll.useQuery();

  // Find most recent completed tournament
  const recentTournament = useMemo(() => {
    const now = new Date();
    const completed = tournaments.filter((t) => t.endDate < now);
    return completed.sort(
      (a, b) => b.endDate.getTime() - a.endDate.getTime(),
    )[0];
  }, [tournaments]);

  // Get champion teams for the recent tournament
  const { data: championTeams = [], isLoading: teamsLoading } =
    api.team.getByTournament.useQuery(
      { tournamentId: recentTournament?.id ?? "" },
      { enabled: !!recentTournament?.id },
    );

  // Filter to only champions (position 1)
  const champions = useMemo(() => {
    return championTeams.filter((team) => team.position === "1");
  }, [championTeams]);

  const isLoading = tournamentsLoading || teamsLoading;

  return useMemo(
    () => ({
      tournament: recentTournament,
      champs: champions,
      isLoading,
    }),
    [recentTournament, champions, isLoading],
  );
}
