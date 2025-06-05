"use client";

import { useMainStore } from "./store";
import { initializeLeaderboardStore } from "./leaderboardInit";

/**
 * Check if tournament state needs to transition and update accordingly
 * Returns true if any transition occurred
 */
export async function checkTournamentTransitions(): Promise<boolean> {
  const state = useMainStore.getState();
  const { nextTournament, currentTournament, seasonTournaments } = state;
  
  const now = new Date();
  let transitionOccurred = false;

  console.log("🔍 Checking tournament transitions...");

  // Case 1: Next tournament should become current (start time has passed)
  if (nextTournament && new Date(nextTournament.startDate) <= now) {
    console.log(`🏆 Transitioning "${nextTournament.name}" from next to current tournament`);
    
    // Find new next tournament from season tournaments
    let newNextTournament = null;
    if (seasonTournaments) {
      const futureTournaments = seasonTournaments
        .filter(t => new Date(t.startDate) > now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      newNextTournament = futureTournaments[0] ?? null;
      if (newNextTournament) {
        console.log(`📅 Setting "${newNextTournament.name}" as new next tournament`);
      }
    }
    
    // Update current tournament and next tournament
    useMainStore.setState({
      currentTournament: nextTournament,
      nextTournament: newNextTournament,
      _lastUpdated: Date.now(),
    });

    // Initialize leaderboard store for the new current tournament
    try {
      const leaderboardInitialized = await initializeLeaderboardStore();
      if (leaderboardInitialized) {
        console.log("✅ Leaderboard store initialized for new current tournament");
      }
    } catch (error) {
      console.error("❌ Failed to initialize leaderboard store for new current tournament:", error);
    }

    transitionOccurred = true;
  }

  // Case 2: Current tournament should move to past (end date passed or round 5 reached)
  if (currentTournament) {
    const isCompleted = (currentTournament.currentRound ?? 0) >= 5;
    const isExpired = new Date(currentTournament.endDate) < now;
    
    if (isCompleted || isExpired) {
      console.log(`📅 Moving "${currentTournament.name}" from current to past tournament`);
      
      useMainStore.setState({
        currentTournament: null,
        _lastUpdated: Date.now(),
      });

      transitionOccurred = true;
    }
  }

  // Case 3: Find new next tournament if we don't have one (and we haven't just set one)
  if (!useMainStore.getState().nextTournament && seasonTournaments && !transitionOccurred) {
    const futureTournaments = seasonTournaments
      .filter(t => new Date(t.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    if (futureTournaments.length > 0) {
      const newNextTournament = futureTournaments[0];
      console.log(`📅 Setting "${newNextTournament?.name}" as new next tournament`);
      
      useMainStore.setState({
        nextTournament: newNextTournament,
        _lastUpdated: Date.now(),
      });

      transitionOccurred = true;
    }
  }

  if (transitionOccurred) {
    console.log("✅ Tournament state transitions completed");
  } else {
    console.log("📅 No tournament transitions needed");
  }

  return transitionOccurred;
}

/**
 * Start automatic tournament transition checking
 * Returns a cleanup function to stop the polling
 */
export function startTournamentTransitionPolling(intervalMs = 300000): () => void {
  console.log(`🔄 Starting tournament transition polling (${intervalMs / 1000}s interval)`);
  
  const intervalId = setInterval(() => {
    void (async () => {
      try {
        await checkTournamentTransitions();
      } catch (error) {
        console.error("❌ Error during tournament transition check:", error);
      }
    })();
  }, intervalMs);

  // Return cleanup function
  return () => {
    console.log("⏹️ Stopping tournament transition polling");
    clearInterval(intervalId);
  };
}

/**
 * Hook to automatically manage tournament transitions
 */
export function useTournamentTransitions(options: {
  enabled?: boolean;
  intervalMs?: number;
} = {}) {
  const { enabled = true, intervalMs = 300000 } = options;
  
  // Only run on client side
  if (typeof window === 'undefined') return;

  // Start polling when enabled
  if (enabled) {
    const cleanup = startTournamentTransitionPolling(intervalMs);
    
    // Cleanup on unmount
    return cleanup;
  }
}

/**
 * Manual test function to verify tournament transition logic
 * Call this from browser console: window.testTournamentTransitions()
 */
export function manualTestTournamentTransitions(): void {
  if (typeof window !== 'undefined') {
    (window as unknown as { testTournamentTransitions: () => Promise<boolean> }).testTournamentTransitions = async () => {
      console.log("🧪 Manual tournament transition test started");
      const result = await checkTournamentTransitions();
      console.log("🧪 Test result:", result ? "Transitions occurred" : "No transitions needed");
      return result;
    };
    
    (window as unknown as { getTournamentStatus: () => ReturnType<typeof useMainStore.getState> }).getTournamentStatus = () => {
      const state = useMainStore.getState();
      const now = new Date();
      
      console.log("📊 Tournament Status:", {
        current: state.currentTournament ? {
          name: state.currentTournament.name,
          startDate: state.currentTournament.startDate,
          endDate: state.currentTournament.endDate,
          currentRound: state.currentTournament.currentRound,
        } : null,
        next: state.nextTournament ? {
          name: state.nextTournament.name,
          startDate: state.nextTournament.startDate,
          endDate: state.nextTournament.endDate,
        } : null,
        now: now.toISOString(),
        seasonTournaments: state.seasonTournaments?.length ?? 0,
      });
      
      return state;
    };
    
    console.log("🧪 Manual test functions registered:");
    console.log("  - window.testTournamentTransitions() - Test transitions");
    console.log("  - window.getTournamentStatus() - View current state");
  }
}

/**
 * Debug function to log detailed tournament timing information
 */
export function debugTournamentTiming(): void {
  const state = useMainStore.getState();
  const now = new Date();
  
  console.log("🕐 Tournament Timing Debug:", {
    currentTime: now.toISOString(),
    currentTournament: state.currentTournament ? {
      name: state.currentTournament.name,
      startDate: state.currentTournament.startDate,
      endDate: state.currentTournament.endDate,
      currentRound: state.currentTournament.currentRound,
      isStarted: new Date(state.currentTournament.startDate) <= now,
      isEnded: new Date(state.currentTournament.endDate) < now,
      isCompleted: (state.currentTournament.currentRound ?? 0) >= 5,
    } : "None",
    nextTournament: state.nextTournament ? {
      name: state.nextTournament.name,
      startDate: state.nextTournament.startDate,
      endDate: state.nextTournament.endDate,
      shouldBecomeCurrent: new Date(state.nextTournament.startDate) <= now,
      timeUntilStart: new Date(state.nextTournament.startDate).getTime() - now.getTime(),
    } : "None",
    allTournaments: state.seasonTournaments?.map(t => ({
      name: t.name,
      startDate: t.startDate,
      endDate: t.endDate,
      currentRound: t.currentRound,
      status: new Date(t.startDate) > now ? "future" : 
              new Date(t.startDate) <= now && new Date(t.endDate) >= now && (t.currentRound ?? 0) < 5 ? "current" :
              "past"
    })) ?? [],
  });
}
