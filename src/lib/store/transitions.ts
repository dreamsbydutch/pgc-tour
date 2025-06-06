/**
 * Streamlined Tournament Transitions
 * 
 * Simple polling system for tournament state changes
 * Integrated with the streamlined store architecture
 */

import { useMainStore } from "./store";
import { refreshTournamentData } from "./mainInit";

// Tournament transition polling
let transitionPollingInterval: NodeJS.Timeout | null = null;

// Check for tournament transitions and update store
async function checkTournamentTransitions(): Promise<void> {
  try {
    console.log('🔄 Checking for tournament transitions...');
    
    // Refresh tournament data which will update current/next tournaments
    await refreshTournamentData();
    
    // Also update tournament state in case dates have changed
    useMainStore.getState().updateTournamentState();
    
    console.log('✅ Tournament transition check completed');
  } catch (error) {
    console.error('❌ Tournament transition check failed:', error);
  }
}

// Start polling for tournament transitions
export function startTournamentTransitionPolling(intervalMs = 300000): () => void {
  console.log(`🔄 Starting tournament transition polling (${intervalMs}ms interval)`);
  
  // Clear any existing polling
  stopTournamentTransitionPolling();
  
  // Start polling
  transitionPollingInterval = setInterval(() => {
    void checkTournamentTransitions();
  }, intervalMs);
  
  // Return cleanup function
  return stopTournamentTransitionPolling;
}

export function stopTournamentTransitionPolling(): void {
  if (transitionPollingInterval) {
    console.log('🛑 Stopping tournament transition polling');
    clearInterval(transitionPollingInterval);
    transitionPollingInterval = null;
  }
}

// Manual check for development/testing
export function manualTestTournamentTransitions(): void {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    (window as unknown as Record<string, unknown>).checkTournamentTransitions = checkTournamentTransitions;
    (window as unknown as Record<string, unknown>).refreshTournamentData = refreshTournamentData;
    
    console.log('🛠️ Tournament transition test functions available:');
    console.log('- window.checkTournamentTransitions()');
    console.log('- window.refreshTournamentData()');
  }
}

// Tournament utilities
export const tournamentUtils = {
  // Manual transition check
  checkTransitions: checkTournamentTransitions,
  
  // Start/stop polling
  startPolling: startTournamentTransitionPolling,
  stopPolling: stopTournamentTransitionPolling,
  
  // Get current tournament status
  getStatus: () => {
    const state = useMainStore.getState();
    return {
      currentTournament: state.currentTournament?.name ?? "None",
      nextTournament: state.nextTournament?.name ?? "None",
      lastUpdated: state._lastUpdated,
      dataAge: state._lastUpdated ? Date.now() - state._lastUpdated : null,
    };
  },
  
  // Force tournament state update
  updateState: () => {
    useMainStore.getState().updateTournamentState();
  },
};

// Make available in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).tournamentUtils = tournamentUtils;
}
