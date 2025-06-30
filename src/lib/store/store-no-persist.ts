"use client";

import React from "react";
import { create } from "zustand";
import { createClient } from "@/src/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { PGCTourStoreState } from "./types";

// Helper to check if we're on the client side
const isClient = typeof window !== "undefined";

// Store auth unsubscribe function outside the store to persist across re-renders
let authUnsubscribe: (() => void) | null = null;
let isInitializing = false; // Prevent multiple concurrent initializations

// Create store WITHOUT persistence middleware to test if that's the issue
export const useNonPersistentPGCTourStore = create<PGCTourStoreState>()((
  set,
  get,
) => {
  const supabase = createClient();

  // Simplified auth state update
  const updateAuthState = async (
    user: User | null,
    session: Session | null,
  ) => {
    const isAuthenticated = !!user && !!session;

    set({
      authUser: user,
      authSession: session,
      isAuthenticated,
      authLoading: false,
      authError: null,
    });

    console.log("Auth state updated:", {
      userId: user?.id,
      isAuthenticated,
      sessionValid: !!session,
    });
  };

  return {
    // Auth state (not persisted)
    authUser: null,
    authSession: null,
    isAuthenticated: false,
    authLoading: true,
    authError: null,

    // UI state (persisted)
    selectedTournamentId: null,
    selectedTourId: null,
    selectedTourCardId: null,

    // Data state (persisted)
    currentSeason: null,
    tours: [],
    tiers: [],
    tournaments: [],
    tourCards: [],
    courses: [],
    member: null,
    pastData: {
      teams: [],
      golfers: [],
    },

    // Auth actions
    setAuthUser: (user) => set({ authUser: user }),
    setAuthSession: (session) => set({ authSession: session }),
    setAuthLoading: (loading) => set({ authLoading: loading }),
    setAuthError: (error) => set({ authError: error }),

    // UI actions
    setSelectedTournament: (id) => set({ selectedTournamentId: id }),
    setSelectedTour: (id) => set({ selectedTourId: id }),
    setSelectedTourCard: (id) => set({ selectedTourCardId: id }),

    // Data actions
    setCurrentSeason: (season) => set({ currentSeason: season }),
    setTours: (tours) => set({ tours }),
    setTiers: (tiers) => set({ tiers }),
    setTournaments: (tournaments) => set({ tournaments }),
    setTourCards: (tourCards) => set({ tourCards }),
    setCourses: (courses) => set({ courses }),
    setMember: (member) => set({ member }),
    setPastData: (teams, golfers) =>
      set({
        pastData: { teams, golfers },
      }),

    // Utility actions
    clearAll: () =>
      set({
        currentSeason: null,
        tours: [],
        tiers: [],
        tournaments: [],
        tourCards: [],
        courses: [],
        member: null,
        pastData: { teams: [], golfers: [] },
        selectedTournamentId: null,
        selectedTourId: null,
        selectedTourCardId: null,
      }),

    // Auth initialization - simplified
    initializeAuth: async () => {
      console.log("Auth initialization called (non-persistent store)");
      set({
        authLoading: false,
        authError: null,
      });
    },

    // Sign out
    signOut: async () => {
      try {
        await supabase.auth.signOut();
        // Auth listener will handle clearing state
      } catch (error) {
        console.error("Error signing out:", error);
        set({
          authError: error instanceof Error ? error.message : "Sign out error",
        });
      }
    },

    // Cleanup auth listener
    cleanup: () => {
      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }
      isInitializing = false; // Reset initialization flag
    },
  };
});
