import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTournamentStore } from "../domains/tournament/store";
import { tournamentService } from "../services/tournament.service";

export function useTournamentData(tournamentId?: string) {
  const store = useTournamentStore();

  // Query for specific tournament
  const tournamentQuery = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => tournamentService.getTournament(tournamentId!),
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for all tournaments
  const tournamentsQuery = useQuery({
    queryKey: ["tournaments"],
    queryFn: tournamentService.getAllTournaments,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Sync with store when data changes
  useEffect(() => {
    if (tournamentQuery.data) {
      store.addTournament(tournamentQuery.data);
    }
  }, [tournamentQuery.data, store]);

  useEffect(() => {
    if (tournamentsQuery.data) {
      tournamentsQuery.data.forEach((t) => store.addTournament(t));
    }
  }, [tournamentsQuery.data, store]);

  return {
    tournament: tournamentId ? store.tournaments.get(tournamentId) : null,
    tournaments: Array.from(store.tournaments.values()),
    currentTournament: store.currentTournament,
    nextTournament: store.nextTournament,
    pastTournaments: store.pastTournaments,
    isLoading: tournamentQuery.isLoading || tournamentsQuery.isLoading,
    error: tournamentQuery.error || tournamentsQuery.error,
    refetch: tournamentQuery.refetch,
  };
}
