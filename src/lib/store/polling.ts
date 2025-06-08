/**
 * Polling System for Store Data
 * 
 * Manages automatic polling for leaderboard updates during active tournaments
 * and tournament state transitions.
 */

import { useMainStore, useLeaderboardStore } from "./store";
import { refreshLeaderboard, shouldPollLeaderboard, refreshTournamentData } from "./init";

// Polling intervals
let leaderboardPollingInterval: NodeJS.Timeout | null = null;
let tournamentTransitionInterval: NodeJS.Timeout | null = null;

/**
 * Start leaderboard polling during active tournaments
 */
export function startLeaderboardPolling(intervalMs = 300000): () => void {
  console.log(`🔄 Starting leaderboard polling (${intervalMs / 1000}s interval)`);
  
  // Clear any existing polling
  stopLeaderboardPolling();
  
  const currentTournament = useMainStore.getState().currentTournament;
    if (!currentTournament || !shouldPollLeaderboard(currentTournament)) {
    console.log('⏸️ Polling not needed - no active tournament');
    return () => {
      // No cleanup needed
    };
  }
  
  // Set polling state
  useLeaderboardStore.getState().setPolling(true);
  
  // Initial refresh
  void refreshLeaderboard();
    // Start polling
  leaderboardPollingInterval = setInterval(() => {
    void (async () => {
      const tournament = useMainStore.getState().currentTournament;
      
      if (!tournament || !shouldPollLeaderboard(tournament)) {
        console.log('⏸️ Stopping polling - tournament ended or not active');
        stopLeaderboardPolling();
        return;
      }
      
      await refreshLeaderboard();
    })();
  }, intervalMs);
  
  // Return cleanup function
  return stopLeaderboardPolling;
}

/**
 * Stop leaderboard polling
 */
export function stopLeaderboardPolling(): void {
  if (leaderboardPollingInterval) {
    console.log('🛑 Stopping leaderboard polling');
    clearInterval(leaderboardPollingInterval);
    leaderboardPollingInterval = null;
    useLeaderboardStore.getState().setPolling(false);
  }
}

/**
 * Check for tournament transitions and update store
 */
async function checkTournamentTransitions(): Promise<void> {
  try {
    console.log('🔄 Checking for tournament transitions...');
    
    // Use the existing refresh function from init.ts
    await refreshTournamentData();
    
    console.log('✅ Tournament transition check completed');
  } catch (error) {
    console.error('❌ Tournament transition check failed:', error);
  }
}

/**
 * Start polling for tournament transitions
 */
export function startTournamentTransitionPolling(intervalMs = 3600000): () => void {
  console.log(`🔄 Starting tournament transition polling (${intervalMs / 1000}s interval)`);
  
  // Clear any existing polling
  stopTournamentTransitionPolling();
  
  // Start polling
  tournamentTransitionInterval = setInterval(() => {
    void checkTournamentTransitions();
  }, intervalMs);
  
  // Return cleanup function
  return stopTournamentTransitionPolling;
}

/**
 * Stop tournament transition polling
 */
export function stopTournamentTransitionPolling(): void {
  if (tournamentTransitionInterval) {
    console.log('🛑 Stopping tournament transition polling');
    clearInterval(tournamentTransitionInterval);
    tournamentTransitionInterval = null;
  }
}

/**
 * Smart polling that adapts to tournament state
 * - Polls leaderboard frequently during active tournaments
 * - Polls tournament transitions less frequently
 */
export function startSmartPolling(): () => void {
  console.log('🧠 Starting smart polling system');
  
  const currentTournament = useMainStore.getState().currentTournament;
  
  // Start tournament transition polling (every hour)
  const stopTransitionPolling = startTournamentTransitionPolling(3600000);
  
  // Start leaderboard polling if there's an active tournament
  let stopLeaderboardPolling: (() => void) | null = null;
  
  if (currentTournament && shouldPollLeaderboard(currentTournament)) {
    // Poll every 5 minutes during active tournaments
    stopLeaderboardPolling = startLeaderboardPolling(300000);
  }
  
  // Return cleanup function that stops all polling
  return () => {
    stopTransitionPolling();
    if (stopLeaderboardPolling) {
      stopLeaderboardPolling();
    }
  };
}

/**
 * Get current polling status
 */
export function getPollingStatus() {
  const leaderboardState = useLeaderboardStore.getState();
  const mainState = useMainStore.getState();
  
  return {
    leaderboard: {
      isPolling: leaderboardState.isPolling,
      hasData: !!(leaderboardState.teams?.length ?? leaderboardState.golfers?.length),
      lastUpdated: leaderboardState._lastUpdated,
    },
    tournament: {
      currentTournament: mainState.currentTournament?.name ?? 'None',
      nextTournament: mainState.nextTournament?.name ?? 'None',
      lastUpdated: mainState._lastUpdated,
    },
    intervals: {
      leaderboard: leaderboardPollingInterval !== null,
      transitions: tournamentTransitionInterval !== null,
    }
  };
}

/**
 * Manually refresh leaderboard data
 */
export async function manualRefreshLeaderboard(): Promise<void> {
  console.log('🔄 Manual leaderboard refresh requested');
  
  try {
    await refreshLeaderboard();
    console.log('✅ Manual leaderboard refresh completed');
  } catch (error) {
    console.error('❌ Manual leaderboard refresh failed:', error);
    throw error;
  }
}

// Development utilities
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const windowWithUtils = window as Window & {
    pollingUtils?: Record<string, unknown>;
  };
  
  windowWithUtils.pollingUtils = {
    start: startSmartPolling,
    startLeaderboard: startLeaderboardPolling,
    startTransitions: startTournamentTransitionPolling,
    stopLeaderboard: stopLeaderboardPolling,
    stopTransitions: stopTournamentTransitionPolling,
    status: getPollingStatus,
    checkTransitions: checkTournamentTransitions,
    manualRefresh: manualRefreshLeaderboard,
  };
  
  console.log('🛠️ Polling utilities available at window.pollingUtils');
}
