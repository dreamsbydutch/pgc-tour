/**
 * Streamlined Zustand Store for PGC Tour
 * 
 * Simplified architecture with direct integration of auth and data management
 * Removed complex coordination layers in favor of straightforward state management
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
  // Core tournament and public data (rarely changes)
  seasonTournaments: TournamentData[] | null;
  tourCards: TourCard[] | null;
  tours: Tour[] | null;
  pastTournaments:
    | (TournamentData & {
        teams: (Team & { tourCard: TourCard | null })[];
        golfers: Golfer[];
      })[]
    | null;
  
  // Dynamic tournament state (changes based on dates)
  currentTournament: TournamentData | null;
  nextTournament: TournamentData | null;
  
  // Static season data
  currentSeason: Season | null;
  currentTiers: Tier[] | null;
  
  // User-specific state (changes with auth)
  currentMember: Member | null;
  currentTour: Tour | null;
  currentTourCard: TourCard | null;
  isAuthenticated: boolean;
  authLastUpdated: number | null;
  
  // Core store actions
  setAuthState: (member: Member | null, isAuthenticated: boolean) => void;
  updateTournamentState: () => void;
  initializeData: (data: Partial<MainStoreState>) => void;
  reset: () => void;
  _lastUpdated: number | null;
}

interface LeaderboardStoreState {
  teams: (Team & { tourCard: TourCard | null })[] | null;
  golfers: Golfer[] | null;
  update: (
    teams: (Team & { tourCard: TourCard | null })[] | null,
    golfers: Golfer[] | null,
  ) => void;
  isPolling: boolean;
  setPolling: (isPolling: boolean) => void;
  reset: () => void;
  _lastUpdated: number | null;
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
  authLastUpdated: null,
  _lastUpdated: null,
});

export const useMainStore = create<MainStoreState>()(
  persist(
    (set, get) => ({
      ...getInitialMainState(),
      
      // Handle auth state changes and update user-specific data
      setAuthState: (member: Member | null, isAuthenticated: boolean) => {
        set((state) => {
          const newState = {
            ...state,
            currentMember: member,
            isAuthenticated,
            authLastUpdated: Date.now(),
          };

          if (isAuthenticated && member) {
            // Find user's tour card and tour when signing in
            const userTourCard = state.tourCards?.find(tc => tc.memberId === member.id) ?? null;
            const userTour = userTourCard 
              ? state.tours?.find(t => t.id === userTourCard.tourId) ?? null 
              : null;
            
            newState.currentTourCard = userTourCard;
            newState.currentTour = userTour;
          } else {
            // Clear user-specific data when signing out
            newState.currentTour = null;
            newState.currentTourCard = null;
          }

          return newState;
        });
      },

      // Update tournament state based on current date
      updateTournamentState: () => {
        set((state) => {
          if (!state.seasonTournaments?.length) return state;

          const now = new Date();
          const tournaments = [...state.seasonTournaments].sort(
            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );

          // Find current tournament (started but not ended, and not completed)
          const currentTournament = tournaments.find(
            t => new Date(t.startDate) <= now && 
                 new Date(t.endDate) >= now && 
                 (t.currentRound ?? 0) < 5
          ) ?? null;

          // Find next tournament (not yet started)
          const nextTournament = tournaments.find(
            t => new Date(t.startDate) > now
          ) ?? null;

          // Only update if there's actually a change
          if (state.currentTournament?.id === currentTournament?.id && 
              state.nextTournament?.id === nextTournament?.id) {
            return state;
          }

          // Only log significant tournament changes
          if (process.env.NODE_ENV === "development") {
            console.log("🔄 Tournament state updated:", {
              current: currentTournament?.name ?? "None",
              next: nextTournament?.name ?? "None"
            });
          }

          return {
            ...state,
            currentTournament,
            nextTournament,
            _lastUpdated: Date.now(),
          };
        });
      },

      // Initialize store with data (called once during app load)
      initializeData: (data: Partial<MainStoreState>) => {
        set((state) => ({
          ...state,
          ...data,
          _lastUpdated: Date.now(),
        }));
        
        // Update tournament state after initialization
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
            if (process.env.NODE_ENV === "development") {
              console.error("❌ Store rehydration error:", error);
            }
            localStorage.removeItem("pgc-main-store");
          } else {
            // Check tournament state after rehydration without logging
            setTimeout(() => {
              useMainStore.getState().updateTournamentState();
            }, 0);
          }
        };
      },
      skipHydration: typeof window === "undefined",
      version: 1,
      partialize: (state) => {
        // Only persist essential data
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
          authLastUpdated,
          _lastUpdated,
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
          authLastUpdated,
          _lastUpdated,
        };
      },
    },
  ),
);

export const useLeaderboardStore = create<LeaderboardStoreState>((set) => ({
  teams: null,
  golfers: null,
  _lastUpdated: null,
  isPolling: false,
  
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
  
  reset: () => set({
    teams: null,
    golfers: null,
    _lastUpdated: null,
    isPolling: false,
  }),
}));

// Tournament state checker (runs periodically)
export const startTournamentStateChecker = () => {
  if (typeof window === "undefined") return;

  // Check tournament state every hour
  const checkInterval = setInterval(() => {
    useMainStore.getState().updateTournamentState();
  }, 60 * 60 * 1000); // 1 hour

  // Also check when page becomes visible (user returns to tab)
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      useMainStore.getState().updateTournamentState();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Return cleanup function
  return () => {
    clearInterval(checkInterval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
};

// Supabase auth integration utilities
export const authUtils = {
  // Sync Supabase auth with store
  syncAuthState: async (supabaseUser: User | null): Promise<Member | null> => {
    try {
      if (supabaseUser) {
        // Fetch member data from API using Supabase user
        const accessToken = (supabaseUser as unknown as Record<string, unknown>).access_token as string;
        const response = await fetch("/api/members/current", {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (response.ok) {
          const responseData = await response.json() as { member: Member };
          const { member } = responseData;
          if (member) {
            useMainStore.getState().setAuthState(member, true);
            return member;
          }
        }
      }
      
      // Clear auth state if no user or API call failed
      useMainStore.getState().setAuthState(null, false);
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Auth sync error:", error);
      }
      useMainStore.getState().setAuthState(null, false);
      return null;
    }
  },

  // Handle sign out
  signOut: () => {
    useMainStore.getState().setAuthState(null, false);
  },

  // Get current auth state
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

// Simplified utilities focusing on key operations
export const storeUtils = {
  // Tournament state utilities
  checkTournamentState: () => {
    useMainStore.getState().updateTournamentState();
  },

  // Development utilities
  reset: () => {
    useMainStore.getState().reset();
    useLeaderboardStore.getState().reset();
    localStorage.removeItem("pgc-main-store");
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Complete reset");
    }
  },

  getStatus: () => {
    const state = useMainStore.getState();
    return {
      hasData: !!(state.seasonTournaments?.length && state.tourCards?.length),
      isAuthenticated: state.isAuthenticated,
      currentTournament: state.currentTournament?.name ?? "None",
      nextTournament: state.nextTournament?.name ?? "None",
      lastUpdated: state._lastUpdated,
    };
  },
};

// Make utilities available in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.storeUtils = { ...storeUtils, ...authUtils };
}

declare global {
  interface Window {
    storeUtils?: typeof storeUtils & typeof authUtils;
  }
}
