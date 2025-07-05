import {
  Course,
  Golfer,
  Member,
  Season,
  Team,
  Tier,
  Tour,
  TourCard,
  Tournament,
} from "@prisma/client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SeasonalData = {
  season: Season | null;
  member: Member | null;
  tourCard: TourCard | null;
  allTourCards: TourCard[] | null;
  tournaments:
    | (Tournament & { course: Course; teams: Team[]; golfers: Golfer[] })[]
    | null;
  tiers: Tier[] | null;
  tours: Tour[] | null;
  lastLoaded: number | null;

  setSeasonalData: (data: Partial<SeasonalData>) => void;
  reset: () => void;
  updateMember: (member: Member) => void;
};

export const useSeasonalStore = create<SeasonalData>()(
  persist(
    (set) => ({
      season: null,
      member: null,
      tourCard: null,
      allTourCards: null,
      tournaments: null,
      tiers: null,
      tours: null,
      lastLoaded: null,

      setSeasonalData: (data) =>
        set((state) => ({ ...state, ...data, lastLoaded: Date.now() })),
      reset: () =>
        set({
          season: null,
          member: null,
          tourCard: null,
          allTourCards: null,
          tournaments: null,
          tiers: null,
          tours: null,
          lastLoaded: null,
        }),
      updateMember: (member: Member) =>
        set((state) => ({
          ...state,
          member: { ...state.member, ...member },
        })),
    }),
    {
      name: "seasonal-data-storage",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
    },
  ),
);
