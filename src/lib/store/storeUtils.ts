/**
 * Store Utilities
 * Helper functions for store operations and debugging
 */

import { useMainStore, useLeaderboardStore } from "./store";

/**
 * Clear all localStorage data
 */
export const clearAllLocalStorage = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    console.log('🗑️ All localStorage cleared');
  }
};

/**
 * Reset the main store to its initial state
 */
export const resetMainStore = () => {
  useMainStore.getState().reset();
  console.log('🔄 Main store reset');
};

/**
 * Reset the leaderboard store to its initial state
 */
export const resetLeaderboardStore = () => {
  useLeaderboardStore.getState().reset();
  console.log('🔄 Leaderboard store reset');
};

/**
 * Development reset - clears all store data
 */
export const developmentReset = () => {
  useMainStore.getState().reset();
  useLeaderboardStore.getState().reset();
  console.log('🔄 All stores reset for development');
};

/**
 * Get cache information for debugging
 */
export const getCacheInfo = () => {
  const mainStore = useMainStore.getState();
  const leaderboardStore = useLeaderboardStore.getState();
  
  return {
    main: {
      lastUpdated: mainStore._lastUpdated,
      hasData: {
        tourCards: (mainStore.tourCards?.length ?? 0) > 0,
        tournaments: (mainStore.seasonTournaments?.length ?? 0) > 0,
        currentTournament: !!mainStore.currentTournament,
        auth: !!mainStore.currentMember,
      }
    },
    leaderboard: {
      lastUpdated: leaderboardStore._lastUpdated,
      hasData: {
        teams: (leaderboardStore.teams?.length ?? 0) > 0,
        golfers: (leaderboardStore.golfers?.length ?? 0) > 0,
        isPolling: leaderboardStore.isPolling,
      }
    },
    timestamp: Date.now()
  };
};
