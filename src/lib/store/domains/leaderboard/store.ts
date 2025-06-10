import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Team, Golfer, TourCard } from "@prisma/client";
import {
  leaderboardService,
  type LeaderboardData,
} from "../../services/leaderboard.service";

interface LeaderboardState {
  leaderboards: Map<string, LeaderboardData>;
  currentLeaderboard: LeaderboardData | null;
  lastUpdated: Map<string, Date>;
  isPolling: boolean;
  error: Error | null;
}

interface LeaderboardActions {
  setLeaderboard: (tournamentId: string, data: LeaderboardData) => void;
  updateTeamPosition: (
    tournamentId: string,
    teamId: string,
    position: string,
  ) => void;
  updateGolferScore: (
    tournamentId: string,
    golferId: string,
    score: number,
  ) => void;
  refreshLeaderboard: (tournamentId: string) => Promise<void>;
  startPolling: (tournamentId: string) => void;
  stopPolling: () => void;
  reset: () => void;
}

export type LeaderboardStore = LeaderboardState & LeaderboardActions;

const initialState: LeaderboardState = {
  leaderboards: new Map(),
  currentLeaderboard: null,
  lastUpdated: new Map(),
  isPolling: false,
  error: null,
};

export const useLeaderboardStore = create<LeaderboardStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      setLeaderboard: (tournamentId, data) =>
        set((state) => {
          state.leaderboards.set(tournamentId, data);
          state.currentLeaderboard = data;
          state.lastUpdated.set(tournamentId, new Date());
        }),

      updateTeamPosition: (tournamentId, teamId, position) =>
        set((state) => {
          const leaderboard = state.leaderboards.get(tournamentId);
          if (leaderboard) {
            const team = leaderboard.teams.find(
              (t) => t.id.toString() === teamId,
            );
            if (team) {
              team.position = position;
              state.lastUpdated.set(tournamentId, new Date());
            }
          }
        }),

      updateGolferScore: (tournamentId, golferId, score) =>
        set((state) => {
          const leaderboard = state.leaderboards.get(tournamentId);
          if (leaderboard) {
            const golfer = leaderboard.golfers.find(
              (g) => g.id.toString() === golferId,
            );
            if (golfer) {
              golfer.score = score;
              state.lastUpdated.set(tournamentId, new Date());
            }
          }
        }),

      refreshLeaderboard: async (tournamentId) => {
        try {
          const data = await leaderboardService.getLeaderboard(tournamentId);
          set((state) => {
            state.leaderboards.set(tournamentId, data);
            state.currentLeaderboard = data;
            state.lastUpdated.set(tournamentId, new Date());
            state.error = null;
          });
        } catch (error) {
          set((state) => {
            state.error = error as Error;
          });
        }
      },

      startPolling: (tournamentId) =>
        set((state) => {
          state.isPolling = true;
          // Subscribe to automatic updates
          leaderboardService.subscribeToUpdates(tournamentId, (data) => {
            get().setLeaderboard(tournamentId, data);
          });
        }),

      stopPolling: () =>
        set((state) => {
          state.isPolling = false;
        }),

      reset: () => set(initialState),
    })),
    { name: "LeaderboardStore" },
  ),
);

// Computed selectors
export const selectTeamsByPosition = (store: LeaderboardStore) => {
  if (!store.currentLeaderboard) return [];
  return [...store.currentLeaderboard.teams]
    .filter((team) => team.position !== "CUT")
    .sort((a, b) => {
      const posA = parseInt(a.position?.replace("T", "") || "999");
      const posB = parseInt(b.position?.replace("T", "") || "999");
      return posA - posB;
    });
};

export const selectGolfersByPosition = (store: LeaderboardStore) => {
  if (!store.currentLeaderboard) return [];
  return [...store.currentLeaderboard.golfers]
    .filter((golfer) => golfer.position !== "CUT")
    .sort((a, b) => {
      const posA = parseInt(a.position?.replace("T", "") || "999");
      const posB = parseInt(b.position?.replace("T", "") || "999");
      return posA - posB;
    });
};
