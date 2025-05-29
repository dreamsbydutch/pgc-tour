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
  currentMember: Member | null;
  currentTour: Tour | null;
  currentTourCard: TourCard | null;
  currentSeason: Season | null;
  currentTiers: Tier[] | null;
  batchUpdate: (updates: Partial<MainStoreState>) => void;
  setCurrentMember: (member: Member) => void;
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
      seasonTournaments: null,
      tourCards: null,
      tours: null,
      pastTournaments: null,
      currentTournament: null,
      nextTournament: null,
      currentMember: null,
      currentTour: null,
      currentTourCard: null,
      currentSeason: null,
      currentTiers: null,
      _lastUpdated: null,
      batchUpdate: (updates) =>
        set({
          ...updates,
          _lastUpdated: Date.now(),
        }),
      setCurrentMember: (member: Member) =>
        set((state) => ({ ...state, currentMember: member })),
    }),
    {
      name: "pgc-main-store", // Name for the localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      onRehydrateStorage: () => {
        return (error) => {
          if (error) {
            console.log("Error rehydrating state:", error);
          } else {
            console.log("Store rehydrated successfully");
          }
        };
      },
      // Only store in client-side environments
      skipHydration: typeof window === "undefined",
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
