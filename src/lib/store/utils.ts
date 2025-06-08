/**
 * Store Utilities
 * 
 * Consolidated utility functions for debugging, state management, and development.
 */

import { useMainStore, useLeaderboardStore } from "./store";
import { 
  initializeStore, 
  refreshLeaderboard, 
  shouldPollLeaderboard,
  startLeaderboardPolling,
  stopLeaderboardPolling,
  startSmartPolling
} from "./init";

// Debug utilities for development
export const debugUtils = {
  // Get complete store state
  getFullState: () => {
    return {
      main: useMainStore.getState(),
      leaderboard: useLeaderboardStore.getState(),
    };
  },

  // Print formatted state to console
  logState: () => {
    const state = debugUtils.getFullState();
    console.group('🏪 Store State Debug');
    
    console.group('📊 Main Store');
    console.log('Auth:', { 
      isAuthenticated: state.main.isAuthenticated, 
      member: state.main.currentMember?.email 
    });
    console.log('Tournaments:', {
      current: state.main.currentTournament?.name ?? 'None',
      next: state.main.nextTournament?.name ?? 'None',
      total: state.main.seasonTournaments?.length ?? 0
    });
    console.log('Data counts:', {
      tourCards: state.main.tourCards?.length ?? 0,
      tours: state.main.tours?.length ?? 0,
      seasons: state.main.currentSeason ? 1 : 0,
      tiers: state.main.currentTiers?.length ?? 0,
    });
    console.groupEnd();

    console.group('🏆 Leaderboard Store');
    console.log('Data:', {
      teams: state.leaderboard.teams?.length ?? 0,
      golfers: state.leaderboard.golfers?.length ?? 0,
      isPolling: state.leaderboard.isPolling
    });
    console.groupEnd();

    console.groupEnd();
  },

  // Reset all stores
  resetAll: () => {
    console.log('🔄 Resetting all stores...');
    useMainStore.getState().reset();
    useLeaderboardStore.getState().reset();
    localStorage.removeItem("pgc-main-store");
    console.log('✅ All stores reset');
  },

  // Force complete refresh
  forceRefresh: async () => {
    console.log('🔄 Force refreshing all data...');
    
    // Reset stores
    useMainStore.getState().reset();
    useLeaderboardStore.getState().reset();
    localStorage.removeItem("pgc-main-store");
    
    // Reload everything
    await initializeStore();
    
    console.log('✅ Force refresh completed');
  }
};

// Data validation utilities
export const validationUtils = {
  // Check if store has required data
  validateStoreData: () => {
    const mainState = useMainStore.getState();
    
    const issues: string[] = [];
    if (!mainState.tours?.length) issues.push('No tours loaded');
    if (!mainState.tourCards?.length) issues.push('No tour cards loaded');
    if (!mainState.currentSeason) issues.push('No current season loaded');
    if (!mainState.currentTiers?.length) issues.push('No tiers loaded');
    if (!mainState.seasonTournaments?.length) issues.push('No tournaments loaded');
    
    return {
      isValid: issues.length === 0,
      issues,
      summary: issues.length === 0 ? 'All required data loaded' : `${issues.length} issues found`
    };
  },

  // Check tournament timing logic
  validateTournamentTiming: () => {
    const mainState = useMainStore.getState();
    const now = new Date();
    
    const issues: string[] = [];
    
    if (mainState.currentTournament) {
      const start = new Date(mainState.currentTournament.startDate);
      const end = new Date(mainState.currentTournament.endDate);
      
      if (start > now) issues.push('Current tournament has not started yet');
      if (end < now) issues.push('Current tournament has already ended');
    }
    
    if (mainState.nextTournament) {
      const start = new Date(mainState.nextTournament.startDate);
      if (start <= now) issues.push('Next tournament should be in the future');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      summary: issues.length === 0 ? 'Tournament timing is correct' : `${issues.length} timing issues found`
    };
  }
};

// Quick action utilities
export const quickActions = {
  // Initialize everything
  init: initializeStore,
  
  // Refresh specific sections
  refresh: {
    leaderboard: refreshLeaderboard,
  },
  
  // Polling controls
  polling: {
    start: startLeaderboardPolling,
    stop: stopLeaderboardPolling,
    smart: startSmartPolling,
    isActive: () => useLeaderboardStore.getState().isPolling,
    status: () => {
      const isPolling = useLeaderboardStore.getState().isPolling;
      const currentTournament = useMainStore.getState().currentTournament;
      const shouldPoll = currentTournament ? shouldPollLeaderboard(currentTournament) : false;
      
      return {
        isPolling,
        shouldPoll,
        tournament: currentTournament?.name ?? 'None',
      };
    },
  },
  
  // Debug actions
  debug: {
    log: debugUtils.logState,
    validate: () => {
      const dataValidation = validationUtils.validateStoreData();
      const timingValidation = validationUtils.validateTournamentTiming();
      
      console.group('🔍 Store Validation');
      console.log('Data:', dataValidation);
      console.log('Timing:', timingValidation);
      console.groupEnd();
      
      return { data: dataValidation, timing: timingValidation };
    },
    reset: debugUtils.resetAll,
    forceRefresh: debugUtils.forceRefresh,
  },

  // Tournament utilities
  shouldPoll: shouldPollLeaderboard,
};

// Make utilities available in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).storeUtils = quickActions;
  (window as unknown as Record<string, unknown>).debugStore = debugUtils;
  (window as unknown as Record<string, unknown>).validateStore = validationUtils;
  
  console.log('🛠️ Store utilities available in development:');
  console.log('- window.storeUtils - Quick actions');
  console.log('- window.debugStore - Debug utilities');
  console.log('- window.validateStore - Validation utilities');
}
