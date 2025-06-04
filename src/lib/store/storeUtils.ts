/**
 * Store utility functions for cache management and reset operations
 * These functions provide admin-level control over store state and cache
 */

import { useMainStore, useLeaderboardStore } from "./store";
import {
  resetInitialization,
  resetLeaderboardInitialization,
} from "../hooks/useInitStore";
import { loadInitialData } from "./mainInit";
import { initializeLeaderboardStore } from "./leaderboardInit";

/**
 * Completely clear all localStorage data for the application
 */
export function clearAllLocalStorage() {
  try {
    localStorage.removeItem("pgc-main-store");
    console.log("✅ Cleared main store localStorage");
  } catch (error) {
    console.error("❌ Error clearing localStorage:", error);
  }
}

/**
 * Reset the main store to initial state
 */
export function resetMainStore() {
  const initialState = {
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
  };

  useMainStore.setState(initialState);
  console.log("✅ Main store reset to initial state");
}

/**
 * Reset the leaderboard store to initial state
 */
export function resetLeaderboardStore() {
  const initialState = {
    teams: null,
    golfers: null,
    _lastUpdated: null,
    isPolling: false,
  };

  useLeaderboardStore.setState(initialState);
  console.log("✅ Leaderboard store reset to initial state");
}

/**
 * Force cache invalidation and fresh data reload
 */
export async function forceCacheInvalidation() {
  console.log("🔄 Starting forced cache invalidation...");

  // Clear localStorage
  clearAllLocalStorage();

  // Reset store states
  resetMainStore();
  resetLeaderboardStore();

  // Reset initialization flags
  resetInitialization();
  resetLeaderboardInitialization();

  // Force fresh data load
  try {
    await loadInitialData();
    await initializeLeaderboardStore();
    console.log("✅ Cache invalidation and refresh completed");
    return true;
  } catch (error) {
    console.error("❌ Error during forced refresh:", error);
    return false;
  }
}

/**
 * Development-only function to completely reset application state
 * USE WITH CAUTION - This will clear all cached data
 */
export async function developmentReset() {
  if (process.env.NODE_ENV !== "development") {
    console.warn("⚠️ Development reset only available in development mode");
    return false;
  }

  console.log("🚨 DEVELOPMENT RESET - Clearing all application state");

  // Clear all localStorage (not just our app)
  try {
    localStorage.clear();
    console.log("✅ All localStorage cleared");
  } catch (error) {
    console.error("❌ Error clearing all localStorage:", error);
  }

  // Reset stores
  resetMainStore();
  resetLeaderboardStore();
  resetInitialization();
  resetLeaderboardInitialization();

  // Reload the page to ensure clean state
  if (typeof window !== "undefined") {
    window.location.reload();
  }

  return true;
}

/**
 * Get detailed cache information for debugging
 */
export function getCacheInfo() {
  const mainState = useMainStore.getState();
  const leaderboardState = useLeaderboardStore.getState();

  const info = {
    mainStore: {
      lastUpdated: mainState._lastUpdated,
      cacheAge: mainState._lastUpdated
        ? Date.now() - mainState._lastUpdated
        : null,
      hasData: {
        tournaments: !!mainState.seasonTournaments,
        tourCards: !!mainState.tourCards,
        tours: !!mainState.tours,
        member: !!mainState.currentMember,
        currentTournament: !!mainState.currentTournament,
      },
    },
    leaderboardStore: {
      lastUpdated: leaderboardState._lastUpdated,
      hasData: {
        teams: !!leaderboardState.teams,
        golfers: !!leaderboardState.golfers,
      },
      isPolling: leaderboardState.isPolling,
    },
    localStorage: {
      mainStoreSize: 0,
      exists: false,
    },
  };

  // Check localStorage size
  try {
    const storedData = localStorage.getItem("pgc-main-store");
    if (storedData) {
      info.localStorage.exists = true;
      info.localStorage.mainStoreSize = storedData.length;
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error);
  }

  return info;
}

/**
 * Log detailed cache information to console
 */
export function logCacheInfo() {
  const info = getCacheInfo();
  console.group("📊 Cache Information");
  console.log("Main Store:", info.mainStore);
  console.log("Leaderboard Store:", info.leaderboardStore);
  console.log("localStorage:", info.localStorage);
  console.groupEnd();
  return info;
}

// Extend the Window interface to include storeUtils
declare global {
  interface Window {
    storeUtils?: {
      clearAllLocalStorage: typeof clearAllLocalStorage;
      resetMainStore: typeof resetMainStore;
      resetLeaderboardStore: typeof resetLeaderboardStore;
      forceCacheInvalidation: typeof forceCacheInvalidation;
      developmentReset: typeof developmentReset;
      getCacheInfo: typeof getCacheInfo;
      logCacheInfo: typeof logCacheInfo;
    };
  }
}

// Make functions available globally in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.storeUtils = {
    clearAllLocalStorage,
    resetMainStore,
    resetLeaderboardStore,
    forceCacheInvalidation,
    developmentReset,
    getCacheInfo,
    logCacheInfo,
  };

  console.log(
    "🛠️ Store utilities available at window.storeUtils in development mode",
  );
}
