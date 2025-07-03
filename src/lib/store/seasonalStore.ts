import {
  Course,
  Member,
  Team,
  Tier,
  Tour,
  TourCard,
  Tournament,
} from "@prisma/client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SeasonalData = {
  member: Member | null;
  tourCard: TourCard | null;
  allTourCards: TourCard[] | null;
  tournaments: (Tournament & { course: Course })[] | null;
  tiers: Tier[] | null;
  tours: Tour[] | null;
  pastTeams: Team[] | null;
  lastLoaded: number | null;

  setSeasonalData: (data: Partial<SeasonalData>) => void;
  reset: () => void;
};

export const useSeasonalStore = create<SeasonalData>()(
  persist(
    (set) => ({
      member: null,
      tourCard: null,
      allTourCards: null,
      tournaments: null,
      tiers: null,
      tours: null,
      pastTeams: null,
      lastLoaded: null,

      setSeasonalData: (data) =>
        set((state) => ({ ...state, ...data, lastLoaded: Date.now() })),
      reset: () =>
        set({
          member: null,
          tourCard: null,
          allTourCards: null,
          tournaments: null,
          tiers: null,
          tours: null,
          pastTeams: null,
          lastLoaded: null,
        }),
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
