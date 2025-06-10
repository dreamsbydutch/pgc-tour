import {
  useUserStore,
  selectCurrentTeamForTournament,
} from "../domains/user/store";

export function useUserData() {
  const store = useUserStore();

  return {
    currentUser: store.currentUser,
    currentMember: store.currentMember,
    currentTourCard: store.currentTourCard,
    userTeams: Array.from(store.userTeams.entries()),
    preferences: store.preferences,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    setCurrentUser: store.setCurrentUser,
    setCurrentMember: store.setCurrentMember,
    setCurrentTourCard: store.setCurrentTourCard,
    addUserTeam: store.addUserTeam,
    updateUserTeam: store.updateUserTeam,
    removeUserTeam: store.removeUserTeam,
    updatePreferences: store.updatePreferences,
    setAuthenticated: store.setAuthenticated,

    // Computed
    currentTeamForTournament: (tournamentId: string) =>
      selectCurrentTeamForTournament(tournamentId)(store),
  };
}

export function useCurrentUser() {
  const { currentUser, isAuthenticated } = useUserData();
  return { currentUser, isAuthenticated };
}

export function useCurrentTourCard() {
  const { currentTourCard } = useUserData();
  return currentTourCard;
}

export function useUserPreferences() {
  const { preferences, updatePreferences } = useUserData();
  return { preferences, updatePreferences };
}

export function useUserTeam(tournamentId: string) {
  const {
    currentTeamForTournament,
    addUserTeam,
    updateUserTeam,
    removeUserTeam,
  } = useUserData();

  return {
    team: currentTeamForTournament(tournamentId),
    addTeam: (team: any) => addUserTeam(tournamentId, team),
    updateTeam: (updates: any) => updateUserTeam(tournamentId, updates),
    removeTeam: () => removeUserTeam(tournamentId),
  };
}
