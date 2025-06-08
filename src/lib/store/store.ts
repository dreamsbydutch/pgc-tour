/**
 * Streamlined Zustand Store for PGC Tour
 *
 * Simplified architecture with direct integration of auth and data management
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import type {
  Member,
  Season,
  Tier,
  Tour,
  TourCard,
  Tournament,
  Course,
  Team,
  Golfer,
} from "@prisma/client";

type TournamentData = Tournament & {
  course: Course | null;
};

interface MainStoreState {
  // Core tournament and public data
  seasonTournaments: TournamentData[] | null;
  tourCards: TourCard[] | null;
  tours: Tour[] | null;
  pastTournaments:
    | (TournamentData & {
        teams: (Team & { tourCard: TourCard | null })[];
        golfers: Golfer[];
      })[]
    | null;

  // Dynamic tournament state
  currentTournament: TournamentData | null;
  nextTournament: TournamentData | null;

  // Static season data
  currentSeason: Season | null;
  currentTiers: Tier[] | null;

  // User-specific state
  currentMember: Member | null;
  currentTour: Tour | null;
  currentTourCard: TourCard | null;
  isAuthenticated: boolean;

  // Tracking
  _lastUpdated: number | null;

  // Core store actions
  setAuthState: (member: Member | null, isAuthenticated: boolean) => void;
  updateTournamentState: () => void;
  initializeData: (data: Partial<MainStoreState>) => void;
  reset: () => void;
}

interface LeaderboardStoreState {
  teams: (Team & { tourCard: TourCard | null })[] | null;
  golfers: Golfer[] | null;
  isPolling: boolean;
  _lastUpdated: number | null;

  update: (
    teams: (Team & { tourCard: TourCard | null })[] | null,
    golfers: Golfer[] | null,
  ) => void;
  setPolling: (isPolling: boolean) => void;
  reset: () => void;
}

const getInitialMainState = () => ({
  seasonTournaments: null,
  tourCards: null,
  tours: null,
  pastTournaments: null,
  currentTournament: null,
  nextTournament: null,
  currentSeason: null,
  currentTiers: null,
  currentMember: null,
  currentTour: null,
  currentTourCard: null,
  isAuthenticated: false,
  _lastUpdated: null,
});

export const useMainStore = create<MainStoreState>()(
  persist(
    (set, get) => ({
      ...getInitialMainState(),

      setAuthState: (member: Member | null, isAuthenticated: boolean) => {
        set((state) => {
          const newState = {
            ...state,
            currentMember: member,
            isAuthenticated,
          };

          if (isAuthenticated && member) {
            const userTourCard =
              state.tourCards?.find((tc) => tc.memberId === member.id) ?? null;
            const userTour = userTourCard
              ? (state.tours?.find((t) => t.id === userTourCard.tourId) ?? null)
              : null;

            newState.currentTourCard = userTourCard;
            newState.currentTour = userTour;
          } else {
            newState.currentTour = null;
            newState.currentTourCard = null;
          }

          return newState;
        });
      },

      updateTournamentState: () => {
        set((state) => {
          if (!state.seasonTournaments?.length) return state;

          const now = new Date();
          const tournaments = [...state.seasonTournaments].sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          );

          const currentTournament =
            tournaments.find(
              (t) =>
                new Date(t.startDate) <= now &&
                new Date(t.endDate) >= now &&
                (t.currentRound ?? 0) < 5,
            ) ?? null;

          const nextTournament =
            tournaments.find((t) => new Date(t.startDate) > now) ?? null;

          if (
            state.currentTournament?.id === currentTournament?.id &&
            state.nextTournament?.id === nextTournament?.id
          ) {
            return state;
          }

          return {
            ...state,
            currentTournament,
            nextTournament,
          };
        });
      },
      initializeData: (data: Partial<MainStoreState>) => {
        set((state) => ({
          ...state,
          ...data,
          _lastUpdated: Date.now(),
        }));

        get().updateTournamentState();
      },

      reset: () => set(getInitialMainState()),
    }),
    {
      name: "pgc-main-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.error("Store rehydration error:", error);
            localStorage.removeItem("pgc-main-store");
          } else {
            setTimeout(() => {
              useMainStore.getState().updateTournamentState();
            }, 0);
          }
        };
      },
      skipHydration: typeof window === "undefined",
      version: 1,
      partialize: (state) => {
        const {
          seasonTournaments,
          tourCards,
          tours,
          pastTournaments,
          currentTournament,
          nextTournament,
          currentMember,
          currentTour,
          currentTourCard,
          currentSeason,
          currentTiers,
          isAuthenticated,
        } = state;

        return {
          seasonTournaments,
          tourCards,
          tours,
          pastTournaments,
          currentTournament,
          nextTournament,
          currentMember,
          currentTour,
          currentTourCard,
          currentSeason,
          currentTiers,
          isAuthenticated,
        };
      },
    },
  ),
);

export const useLeaderboardStore = create<LeaderboardStoreState>((set) => ({
  teams: null,
  golfers: null,
  isPolling: false,
  _lastUpdated: null,

  update: (
    teams: (Team & { tourCard: TourCard | null })[] | null,
    golfers: Golfer[] | null,
  ) =>
    set({
      teams,
      golfers,
      _lastUpdated: Date.now(),
    }),

  setPolling: (isPolling) => set({ isPolling }),

  reset: () =>
    set({
      teams: null,
      golfers: null,
      isPolling: false,
      _lastUpdated: null,
    }),
}));

// Tournament state checker
export const startTournamentStateChecker = () => {
  if (typeof window === "undefined") return;

  const checkInterval = setInterval(
    () => {
      useMainStore.getState().updateTournamentState();
    },
    60 * 60 * 1000,
  ); // 1 hour

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      useMainStore.getState().updateTournamentState();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    clearInterval(checkInterval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
};

// Supabase auth integration
export const authUtils = {
  syncAuthState: async (supabaseUser: User | null): Promise<Member | null> => {
    try {
      if (supabaseUser) {
        const accessToken = (supabaseUser as unknown as Record<string, unknown>)
          .access_token as string;
        const response = await fetch("/api/members/current", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const responseData = (await response.json()) as { member: Member };
          const { member } = responseData;
          if (member) {
            useMainStore.getState().setAuthState(member, true);
            return member;
          }
        }
      }

      useMainStore.getState().setAuthState(null, false);
      return null;
    } catch (error) {
      console.error("Auth sync error:", error);
      useMainStore.getState().setAuthState(null, false);
      return null;
    }
  },

  signOut: () => {
    useMainStore.getState().setAuthState(null, false);
  },

  getAuthState: () => {
    const state = useMainStore.getState();
    return {
      isAuthenticated: state.isAuthenticated,
      member: state.currentMember,
      tourCard: state.currentTourCard,
      tour: state.currentTour,
    };
  },
};
