// src/lib/store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  currentTournament: TournamentData | null;
  nextTournament: TournamentData | null;
  currentSeason: Season | null;
  currentTiers: Tier[] | null;
  
  // User-specific authentication state
  currentMember: Member | null;
  currentTour: Tour | null;
  currentTourCard: TourCard | null;
  isAuthenticated: boolean;
  authLastUpdated: number | null;
  
  // Store management
  batchUpdate: (updates: Partial<MainStoreState>) => void;
  setCurrentMember: (member: Member | null) => void;
  setAuthState: (member: Member | null, isAuthenticated: boolean) => void;
  clearAuthState: () => void;
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
  _lastUpdated: number | null;
}

// Use Zustand's built-in persist middleware
export const useMainStore = create<MainStoreState>()(
  persist(
    (set) => ({
      // Core data
      seasonTournaments: null,
      tourCards: null,
      tours: null,
      pastTournaments: null,
      currentTournament: null,
      nextTournament: null,
      currentSeason: null,
      currentTiers: null,
      
      // Auth state
      currentMember: null,
      currentTour: null,
      currentTourCard: null,
      isAuthenticated: false,
      authLastUpdated: null,
      
      // Store management
      _lastUpdated: null,
      
      batchUpdate: (updates) =>
        set({
          ...updates,
          _lastUpdated: Date.now(),
        }),
        
      setCurrentMember: (member: Member | null) =>
        set((state) => ({ 
          ...state, 
          currentMember: member,
          isAuthenticated: !!member,
          authLastUpdated: Date.now(),
        })),
        
      setAuthState: (member: Member | null, isAuthenticated: boolean) =>
        set((state) => ({
          ...state,
          currentMember: member,
          isAuthenticated,
          authLastUpdated: Date.now(),
          // Clear user-specific data if not authenticated
          ...(isAuthenticated ? {} : {
            currentTour: null,
            currentTourCard: null,
          }),
        })),
        
      clearAuthState: () =>
        set((state) => ({
          ...state,
          currentMember: null,
          currentTour: null,
          currentTourCard: null,
          isAuthenticated: false,
          authLastUpdated: Date.now(),
        })),
    }),
    {
      name: "pgc-main-store", // Name for the localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      onRehydrateStorage: () => {
        console.log("🔄 Starting store rehydration...");
        return (state, error) => {
          if (error) {
            console.error("❌ Error rehydrating pgc-main-store:", error);
            console.error("📊 Error type:", typeof error);

            // Try to extract error details safely
            if (error instanceof Error) {
              console.error("📋 Error details:", {
                name: error.name,
                message: error.message,
                stack: error.stack,
              });
            } else {
              console.error("📋 Error details (non-Error object):", {
                value: error,
                stringified: JSON.stringify(error, null, 2),
              });
            }

            // Check if localStorage data exists and is corrupted
            try {
              const storedData = localStorage.getItem("pgc-main-store");
              if (storedData) {
                console.error("🗄️ Stored data length:", storedData.length);
                console.error(
                  "🗄️ First 200 chars:",
                  storedData.substring(0, 200),
                );

                // Try to parse the stored data to see if it's valid JSON
                try {
                  JSON.parse(storedData);
                  console.log(
                    "✅ Stored data is valid JSON, error might be elsewhere",
                  );
                } catch (parseError) {
                  console.error(
                    "💥 Stored data is corrupted JSON:",
                    parseError,
                  );
                  console.log("🧹 Clearing corrupted localStorage data...");
                  localStorage.removeItem("pgc-main-store");
                }
              } else {
                console.log("📭 No stored data found in localStorage");
              }
            } catch (storageError) {
              console.error("🚫 Error accessing localStorage:", storageError);
            }
          } else {
            console.log("✅ Store rehydrated successfully");
            if (state) {
              console.log("📊 Rehydrated state keys:", Object.keys(state));
            }
          }
        };
      },
      // Only store in client-side environments
      skipHydration: typeof window === "undefined",
      // Add version to help with migration if schema changes
      version: 1,
      // Add more robust error handling for serialization
      partialize: (state) => {
        // Only persist certain fields to avoid circular references or problematic data
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
}));
