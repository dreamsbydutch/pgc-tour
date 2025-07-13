/**
 * Seasonal Store (Zustand)
 *
 * Centralized state management for seasonal golf tournament data.
 *
 * - Provides persistent, reactive access to tournaments, tour cards, tours, tiers, and member data.
 * - Tournaments always include their related course object.
 * - Only tour cards, member, and tourCard may change after initial load; all other data is static for the season.
 *
 * Usage:
 *   - Use setSeasonalData to set static data (season, tournaments, tiers, tours) on initial load.
 *   - Use setMember, setTourCard, setAllTourCards to update dynamic data as needed.
 *   - Use reset to clear all data (e.g., on logout).
 *
 * @module seasonalStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SeasonalData } from "./seasonalStoreTypes";

export const useSeasonalStore = create<SeasonalData>()(
  persist(
    (set, get) => ({
      season: null,
      member: null,
      tourCard: null,
      allTourCards: null,
      tournaments: null,
      tiers: null,
      tours: null,
      lastLoaded: {
        staticData: null,
        tourCard: null,
        allTourCards: null,
      },

      setSeasonalData: (data) =>
        set((s) => ({
          ...s,
          ...data,
          lastLoaded: {
            staticData: Date.now(),
            tourCard: s.lastLoaded?.tourCard ?? null,
            allTourCards: s.lastLoaded?.allTourCards ?? null,
          },
        })),

      setMember: (member) => set((s) => ({ ...s, member })),

      setTourCard: (tourCard) =>
        set((s) => ({
          ...s,
          tourCard,
          lastLoaded: {
            staticData: s.lastLoaded?.staticData ?? null,
            tourCard: Date.now(),
            allTourCards: s.lastLoaded?.allTourCards ?? null,
          },
        })),

      setAllTourCards: (tourCards) =>
        set((s) => ({
          ...s,
          allTourCards: tourCards,
          lastLoaded: {
            staticData: s.lastLoaded?.staticData ?? null,
            tourCard: s.lastLoaded?.tourCard ?? null,
            allTourCards: Date.now(),
          },
        })),

      // Invalidate only the user's tour card
      invalidateTourCard: () =>
        set((s) => ({
          ...s,
          tourCard: null,
          lastLoaded: {
            staticData: s.lastLoaded?.staticData ?? null,
            tourCard: null,
            allTourCards: s.lastLoaded?.allTourCards ?? null,
          },
        })),

      // Invalidate only all tour cards
      invalidateAllTourCards: () =>
        set((s) => ({
          ...s,
          allTourCards: null,
          lastLoaded: {
            staticData: s.lastLoaded?.staticData ?? null,
            tourCard: s.lastLoaded?.tourCard ?? null,
            allTourCards: null,
          },
        })),

      // Invalidate both tour card data types
      invalidateAndRefetchTourCards: () =>
        set((s) => ({
          ...s,
          allTourCards: null,
          tourCard: null,
          lastLoaded: {
            staticData: s.lastLoaded?.staticData ?? null,
            tourCard: null,
            allTourCards: null,
          },
        })),
      reset: () =>
        set({
          season: null,
          member: null,
          tourCard: null,
          allTourCards: null,
          tournaments: null,
          tiers: null,
          tours: null,
          lastLoaded: {
            staticData: null,
            tourCard: null,
            allTourCards: null,
          },
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
