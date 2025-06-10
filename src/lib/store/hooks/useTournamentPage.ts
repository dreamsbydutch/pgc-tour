import { useTournamentData } from "./useTournamentData";
import { useLeaderboardData } from "./useLeaderboardData";
import { useUserData } from "./useUserData";
import { useUIState } from "./useUIState";

export function useTournamentPage(tournamentId?: string) {
  const tournamentData = useTournamentData(tournamentId);
  const leaderboardData = useLeaderboardData(tournamentId);
  const userData = useUserData();
  const uiState = useUIState();

  return {
    // Tournament data
    tournament: tournamentData.tournament,
    currentTournament: tournamentData.currentTournament,
    nextTournament: tournamentData.nextTournament,
    pastTournaments: tournamentData.pastTournaments,
    isLoadingTournament: tournamentData.isLoading,
    tournamentError: tournamentData.error,

    // Leaderboard data
    leaderboard: leaderboardData.leaderboard,
    teams: leaderboardData.teams,
    golfers: leaderboardData.golfers,
    lastUpdated: leaderboardData.lastUpdated,
    isLoadingLeaderboard: leaderboardData.isLoading,
    isPolling: leaderboardData.isPolling,
    leaderboardError: leaderboardData.error,
    refreshLeaderboard: leaderboardData.manualRefresh,

    // User data
    user: userData.currentUser,
    member: userData.currentMember,
    tourCard: userData.currentTourCard,
    userTeam: tournamentId
      ? userData.currentTeamForTournament(tournamentId)
      : null,
    isAuthenticated: userData.isAuthenticated,
    preferences: userData.preferences,

    // UI state
    selectedTour: uiState.selectedTour,
    selectedTournament: uiState.selectedTournament,
    sidebarOpen: uiState.sidebarOpen,
    theme: uiState.theme,
    isAnyLoading: uiState.isAnyLoading,
    hasErrors: uiState.hasErrors,
    currentModal: uiState.currentModal,

    // Combined loading state
    isLoading:
      tournamentData.isLoading ||
      leaderboardData.isLoading ||
      userData.isLoading,

    // Actions
    setSelectedTour: uiState.setSelectedTour,
    setSelectedTournament: uiState.setSelectedTournament,
    setSidebarOpen: uiState.setSidebarOpen,
    setTheme: uiState.setTheme,
    updatePreferences: userData.updatePreferences,
  };
}

// Specialized hooks for different tournament states
export function useActiveTournamentPage(tournamentId: string) {
  const pageData = useTournamentPage(tournamentId);

  return {
    ...pageData,
    // Active tournament specific data
    isActive:
      pageData.tournament &&
      new Date(pageData.tournament.startDate) <= new Date() &&
      new Date(pageData.tournament.endDate) >= new Date() &&
      (pageData.tournament.currentRound || 0) < 5,
  };
}

export function useUpcomingTournamentPage(tournamentId: string) {
  const pageData = useTournamentPage(tournamentId);

  return {
    ...pageData,
    // Upcoming tournament specific data
    isUpcoming:
      pageData.tournament &&
      new Date(pageData.tournament.startDate) > new Date(),
    daysUntilStart: pageData.tournament
      ? Math.ceil(
          (new Date(pageData.tournament.startDate).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null,
  };
}

export function usePastTournamentPage(tournamentId: string) {
  const pageData = useTournamentPage(tournamentId);

  return {
    ...pageData,
    // Past tournament specific data
    isPast:
      pageData.tournament &&
      (new Date(pageData.tournament.endDate) < new Date() ||
        (pageData.tournament.currentRound || 0) >= 5),
  };
}
