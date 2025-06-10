import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { User, TourCard, Team, Member } from "@prisma/client";

export interface UserPreferences {
  defaultTour: string | null;
  theme: "light" | "dark" | "system";
  notifications: {
    tournaments: boolean;
    leaderboard: boolean;
    teams: boolean;
  };
  display: {
    showWorldRanks: boolean;
    showUsage: boolean;
    showPastPosition: boolean;
  };
}

interface UserState {
  currentUser: User | null;
  currentMember: Member | null;
  currentTourCard: TourCard | null;
  userTeams: Map<string, Team>; // tournamentId -> Team
  preferences: UserPreferences;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

interface UserActions {
  setCurrentUser: (user: User | null) => void;
  setCurrentMember: (member: Member | null) => void;
  setCurrentTourCard: (tourCard: TourCard | null) => void;
  addUserTeam: (tournamentId: string, team: Team) => void;
  updateUserTeam: (tournamentId: string, updates: Partial<Team>) => void;
  removeUserTeam: (tournamentId: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setAuthenticated: (authenticated: boolean) => void;
  reset: () => void;
}

export type UserStore = UserState & UserActions;

const defaultPreferences: UserPreferences = {
  defaultTour: null,
  theme: "system",
  notifications: {
    tournaments: true,
    leaderboard: true,
    teams: true,
  },
  display: {
    showWorldRanks: true,
    showUsage: false,
    showPastPosition: true,
  },
};

const initialState: UserState = {
  currentUser: null,
  currentMember: null,
  currentTourCard: null,
  userTeams: new Map(),
  preferences: defaultPreferences,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setCurrentUser: (user) =>
          set((state) => {
            state.currentUser = user;
            state.isAuthenticated = !!user;
          }),

        setCurrentMember: (member) =>
          set((state) => {
            state.currentMember = member;
          }),

        setCurrentTourCard: (tourCard) =>
          set((state) => {
            state.currentTourCard = tourCard;
          }),

        addUserTeam: (tournamentId, team) =>
          set((state) => {
            state.userTeams.set(tournamentId, team);
          }),

        updateUserTeam: (tournamentId, updates) =>
          set((state) => {
            const existingTeam = state.userTeams.get(tournamentId);
            if (existingTeam) {
              state.userTeams.set(tournamentId, {
                ...existingTeam,
                ...updates,
              });
            }
          }),

        removeUserTeam: (tournamentId) =>
          set((state) => {
            state.userTeams.delete(tournamentId);
          }),

        updatePreferences: (preferences) =>
          set((state) => {
            state.preferences = { ...state.preferences, ...preferences };
          }),

        setAuthenticated: (authenticated) =>
          set((state) => {
            state.isAuthenticated = authenticated;
            if (!authenticated) {
              state.currentUser = null;
              state.currentMember = null;
              state.currentTourCard = null;
              state.userTeams.clear();
            }
          }),

        reset: () => set(initialState),
      })),
      {
        name: "user-store",
        partialize: (state) => ({
          currentUser: state.currentUser,
          currentMember: state.currentMember,
          currentTourCard: state.currentTourCard,
          userTeams: Array.from(state.userTeams.entries()),
          preferences: state.preferences,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.userTeams)) {
            // Convert arrays back to Maps after rehydration
            state.userTeams = new Map(state.userTeams as [string, Team][]);
          }
        },
      },
    ),
    { name: "UserStore" },
  ),
);

// Computed selectors
export const selectCurrentTeamForTournament =
  (tournamentId: string) => (store: UserStore) => {
    return store.userTeams.get(tournamentId) || null;
  };

export const selectUserStandings = (store: UserStore) => {
  // This would need to be populated from tournament results
  // For now, return empty array
  return [];
};
