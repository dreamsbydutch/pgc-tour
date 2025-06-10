import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Tournament } from "@prisma/client";
import { tournamentService } from "../../services/tournament.service";

interface TournamentState {
  tournaments: Map<string, Tournament>;
  currentTournament: Tournament | null;
  nextTournament: Tournament | null;
  pastTournaments: Tournament[];
  isLoading: boolean;
  error: Error | null;
}

interface TournamentActions {
  setCurrentTournament: (tournament: Tournament | null) => void;
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  loadTournaments: () => Promise<void>;
  reset: () => void;
}

export type TournamentStore = TournamentState & TournamentActions;

const initialState: TournamentState = {
  tournaments: new Map(),
  currentTournament: null,
  nextTournament: null,
  pastTournaments: [],
  isLoading: false,
  error: null,
};

export const useTournamentStore = create<TournamentStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setCurrentTournament: (tournament) =>
          set((state) => {
            state.currentTournament = tournament;
          }),

        addTournament: (tournament) =>
          set((state) => {
            state.tournaments.set(tournament.id, tournament);
          }),

        updateTournament: (id, updates) =>
          set((state) => {
            const existing = state.tournaments.get(id);
            if (existing) {
              state.tournaments.set(id, { ...existing, ...updates });
            }
          }),

        loadTournaments: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          try {
            const tournaments = await tournamentService.getAllTournaments();
            set((state) => {
              tournaments.forEach((t) => state.tournaments.set(t.id, t));
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.isLoading = false;
            });
          }
        },

        reset: () => set(initialState),
      })),
      {
        name: "tournament-store",
        partialize: (state) => ({
          tournaments: Array.from(state.tournaments.entries()),
          currentTournament: state.currentTournament,
          nextTournament: state.nextTournament,
          pastTournaments: state.pastTournaments,
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.tournaments)) {
            // Convert arrays back to Maps after rehydration
            state.tournaments = new Map(
              state.tournaments as [string, Tournament][],
            );
          }
        },
      },
    ),
    { name: "TournamentStore" },
  ),
);
