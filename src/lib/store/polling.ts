/**
 * Polling System for Store Data
 *
 * This module manages automatic polling for real-time data updates in the PGC Tour application.
 * It provides intelligent polling strategies that adapt to tournament states and user activity.
 *
 * Key Features:
 * - Leaderboard polling during active tournaments (3-minute intervals)
 * - Tournament transition detection (hourly checks)
 * - Smart polling that adapts to tournament state
 * - Manual refresh capabilities
 * - Development utilities for debugging
 * - Production-safe diagnostics
 *
 * Polling Strategy:
 * - Leaderboard: Only during active tournaments (start <= now <= end, round < 5)
 * - Transitions: Continuous monitoring for tournament state changes
 * - Auto-cleanup: Stops polling when tournaments end or become inactive
 */

import { useMainStore, useLeaderboardStore } from "./store";
import {
  refreshLeaderboard,
  shouldPollLeaderboard,
  refreshTournamentData,
} from "./init";

// =====================================================
// Global State Management
// =====================================================

/**
 * Global polling interval references
 * These are stored at module level to ensure proper cleanup
 */
let leaderboardPollingInterval: NodeJS.Timeout | null = null;
let tournamentTransitionInterval: NodeJS.Timeout | null = null;

// =====================================================
// Leaderboard Polling
// =====================================================

/**
 * Starts intelligent leaderboard polling during active tournaments
 *
 * Features:
 * - Automatic validation of tournament state before starting
 * - Sets polling state in leaderboard store
 * - Performs initial refresh before starting interval
 * - Auto-stops when tournament becomes inactive
 * - Returns cleanup function for manual control
 *
 * @param intervalMs - Polling interval in milliseconds (default: 3 minutes)
 * @returns Cleanup function to stop polling
 */
export function startLeaderboardPolling(intervalMs = 180000): () => void {
  console.log(
    `🔄 Starting leaderboard polling (${intervalMs / 1000}s interval)`,
  );

  // Ensure no existing polling conflicts
  stopLeaderboardPolling();

  // Validate tournament state before starting
  const currentTournament = useMainStore.getState().currentTournament;
  if (!currentTournament || !shouldPollLeaderboard(currentTournament)) {
    console.log("⏸️ Polling not needed - no active tournament");
    return () => {
      // Return no-op cleanup function
    };
  }

  // Update store to reflect polling state
  useLeaderboardStore.getState().setPolling(true);

  // Perform initial refresh to get immediate data
  void refreshLeaderboard();

  // Start the polling interval
  leaderboardPollingInterval = setInterval(() => {
    void (async () => {
      // Re-check tournament state on each poll cycle
      const tournament = useMainStore.getState().currentTournament;

      // Auto-stop if tournament is no longer active
      if (!tournament || !shouldPollLeaderboard(tournament)) {
        console.log("⏸️ Auto-stopping polling - tournament ended or inactive");
        stopLeaderboardPolling();
        return;
      }

      // Refresh leaderboard data
      await refreshLeaderboard();
    })();
  }, intervalMs);

  console.log("✅ Leaderboard polling started");

  // Return cleanup function for manual control
  return stopLeaderboardPolling;
}

/**
 * Stops leaderboard polling and cleans up resources
 * Safe to call multiple times - will only act if polling is active
 */
export function stopLeaderboardPolling(): void {
  if (leaderboardPollingInterval) {
    console.log("🛑 Stopping leaderboard polling");
    clearInterval(leaderboardPollingInterval);
    leaderboardPollingInterval = null;

    // Update store to reflect stopped state
    useLeaderboardStore.getState().setPolling(false);
  }
}

// =====================================================
// Tournament Transition Polling
// =====================================================

/**
 * Checks for tournament state transitions and updates the store
 *
 * This function monitors for:
 * - New tournaments starting
 * - Current tournaments ending
 * - Tournament status changes
 * - Leaderboard data preservation for completed tournaments
 *
 * Uses the centralized refresh function from init.ts to maintain consistency
 */
async function checkTournamentTransitions(): Promise<void> {
  try {
    console.log("🔄 Checking for tournament transitions...");

    // Delegate to the comprehensive refresh function in init.ts
    // This handles all transition logic including leaderboard preservation
    await refreshTournamentData();

    console.log("✅ Tournament transition check completed");
  } catch (error) {
    console.error("❌ Tournament transition check failed:", error);
    // Don't re-throw to avoid stopping the polling interval
  }
}

/**
 * Starts polling for tournament state transitions
 *
 * This runs independently of leaderboard polling to ensure we catch
 * tournament transitions even when no active tournament is being polled.
 *
 * @param intervalMs - Polling interval in milliseconds (default: 1 hour)
 * @returns Cleanup function to stop polling
 */
export function startTournamentTransitionPolling(
  intervalMs = 3600000, // 1 hour default
): () => void {
  console.log(
    `🔄 Starting tournament transition polling (${intervalMs / 1000}s interval)`,
  );

  // Ensure no existing polling conflicts
  stopTournamentTransitionPolling();

  // Start the polling interval
  tournamentTransitionInterval = setInterval(() => {
    void checkTournamentTransitions();
  }, intervalMs);

  console.log("✅ Tournament transition polling started");

  // Return cleanup function
  return stopTournamentTransitionPolling;
}

/**
 * Stops tournament transition polling and cleans up resources
 * Safe to call multiple times
 */
export function stopTournamentTransitionPolling(): void {
  if (tournamentTransitionInterval) {
    console.log("🛑 Stopping tournament transition polling");
    clearInterval(tournamentTransitionInterval);
    tournamentTransitionInterval = null;
  }
}

// =====================================================
// Smart Polling System
// =====================================================

/**
 * Intelligent polling system that adapts to tournament state
 *
 * Strategy:
 * - Always monitors for tournament transitions (hourly)
 * - Adds leaderboard polling only during active tournaments (3-minute intervals)
 * - Automatically adjusts when tournaments start/end
 * - Provides single cleanup function for all polling
 *
 * This is the recommended way to start polling in the application.
 *
 * @returns Cleanup function that stops all active polling
 */
export function startSmartPolling(): () => void {
  console.log("🧠 Starting smart polling system");

  const currentTournament = useMainStore.getState().currentTournament;

  // Always start tournament transition monitoring
  const stopTransitionPolling = startTournamentTransitionPolling(3600000); // 1 hour

  // Conditionally start leaderboard polling for active tournaments
  let stopLeaderboardPolling: (() => void) | null = null;
  if (currentTournament && shouldPollLeaderboard(currentTournament)) {
    console.log("🏆 Active tournament detected - starting leaderboard polling");
    stopLeaderboardPolling = startLeaderboardPolling(180000); // 3 minutes
  } else {
    console.log("ℹ️ No active tournament - leaderboard polling disabled");
  }

  console.log("✅ Smart polling system started");

  // Return comprehensive cleanup function
  return () => {
    console.log("🛑 Stopping smart polling system");
    stopTransitionPolling();
    if (stopLeaderboardPolling) {
      stopLeaderboardPolling();
    }
    console.log("✅ Smart polling system stopped");
  };
}

// =====================================================
// Status and Diagnostics
// =====================================================

/**
 * Gets current polling status across all systems
 *
 * @returns Comprehensive status object with polling states and data freshness
 */
export function getPollingStatus() {
  const leaderboardState = useLeaderboardStore.getState();
  const mainState = useMainStore.getState();

  return {
    leaderboard: {
      isPolling: leaderboardState.isPolling,
      hasData: !!(
        leaderboardState.teams?.length ?? leaderboardState.golfers?.length
      ),
      lastUpdated: leaderboardState._lastUpdated,
    },
    tournament: {
      currentTournament: mainState.currentTournament?.name ?? "None",
      nextTournament: mainState.nextTournament?.name ?? "None",
      lastUpdated: mainState._lastUpdated,
    },
    intervals: {
      leaderboard: leaderboardPollingInterval !== null,
      transitions: tournamentTransitionInterval !== null,
    },
  };
}

/**
 * Comprehensive polling diagnostics for production debugging
 *
 * Provides detailed information about:
 * - Current polling states
 * - Tournament status and timing
 * - Data freshness
 * - Browser context
 * - Environment information
 *
 * @returns Detailed diagnostics object safe for production logging
 */
export function getPollingDiagnostics() {
  const status = getPollingStatus();
  const currentTournament = useMainStore.getState().currentTournament;
  const mainStoreLastUpdated = useMainStore.getState()._lastUpdated;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    polling: {
      leaderboard: {
        isActive: status.leaderboard.isPolling,
        hasData: status.leaderboard.hasData,
        lastUpdated: status.leaderboard.lastUpdated
          ? new Date(status.leaderboard.lastUpdated).toISOString()
          : null,
        intervalActive: status.intervals.leaderboard,
      },
      transitions: {
        intervalActive: status.intervals.transitions,
      },
    },
    tournament: {
      current: currentTournament
        ? {
            id: currentTournament.id,
            name: currentTournament.name,
            startDate: currentTournament.startDate,
            endDate: currentTournament.endDate,
            currentRound: currentTournament.currentRound,
            livePlay: currentTournament.livePlay,
            shouldPoll: shouldPollLeaderboard(currentTournament),
          }
        : null,
      lastStoreUpdate: mainStoreLastUpdated
        ? new Date(mainStoreLastUpdated).toISOString()
        : null,
    },
    browser: {
      windowDefined: typeof window !== "undefined",
      documentHidden: typeof document !== "undefined" ? document.hidden : null,
    },
  };

  return diagnostics;
}

/**
 * Logs comprehensive polling diagnostics to console
 * Safe to call in production for debugging
 *
 * @returns The diagnostics object for programmatic use
 */
export function logPollingDiagnostics() {
  const diagnostics = getPollingDiagnostics();
  console.group("🔍 Polling Diagnostics");
  console.log("Environment:", diagnostics.environment);
  console.log("Polling Status:", diagnostics.polling);
  console.log("Tournament:", diagnostics.tournament);
  console.log("Browser Context:", diagnostics.browser);
  console.groupEnd();
  return diagnostics;
}

// =====================================================
// Manual Refresh Functions
// =====================================================

/**
 * Manually refreshes leaderboard data with detailed logging
 *
 * Useful for:
 * - User-triggered refreshes
 * - Debugging data issues
 * - One-off updates outside normal polling
 *
 * @throws Error if refresh fails (unlike polling which fails silently)
 */
export async function manualRefreshLeaderboard(): Promise<void> {
  console.log("🔄 Manual leaderboard refresh requested");

  try {
    // Log current state for comparison
    const beforeState = useLeaderboardStore.getState();
    console.log("📊 Current leaderboard state:", {
      teams: beforeState.teams?.length ?? 0,
      golfers: beforeState.golfers?.length ?? 0,
      lastUpdated: beforeState._lastUpdated
        ? new Date(beforeState._lastUpdated).toISOString()
        : "Never",
    });

    // Perform the refresh
    await refreshLeaderboard();

    // Log updated state for verification
    const afterState = useLeaderboardStore.getState();
    console.log("📊 Updated leaderboard state:", {
      teams: afterState.teams?.length ?? 0,
      golfers: afterState.golfers?.length ?? 0,
      lastUpdated: afterState._lastUpdated
        ? new Date(afterState._lastUpdated).toISOString()
        : "Never",
    });

    console.log("✅ Manual leaderboard refresh completed");
  } catch (error) {
    console.error("❌ Manual leaderboard refresh failed:", error);
    throw error; // Re-throw for manual operations
  }
}

// =====================================================
// Development Utilities
// =====================================================

/**
 * Development-only utilities for debugging and testing
 * Only available in development environment
 */
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const windowWithUtils = window as Window & {
    pollingUtils?: Record<string, unknown>;
  };

  /**
   * Direct API testing utility for development
   * Bypasses store layer to test raw API responses
   */
  const testApiData = async (): Promise<{
    teams: Array<Record<string, unknown>>;
    golfers: Array<Record<string, unknown>>;
  } | null> => {
    try {
      console.log("🧪 Testing API directly...");
      const timestamp = Date.now();
      const response = await fetch(
        `/api/tournaments/leaderboard?t=${timestamp}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      if (response.ok) {
        const data = (await response.json()) as {
          teams: Array<Record<string, unknown>>;
          golfers: Array<Record<string, unknown>>;
        };
        console.log("🧪 Raw API response:", data);
        return data;
      } else {
        console.error(
          "🧪 API request failed:",
          response.status,
          response.statusText,
        );
        return null;
      }
    } catch (error) {
      console.error("🧪 API test failed:", error);
      return null;
    }
  };

  // Expose development utilities on window object
  windowWithUtils.pollingUtils = {
    // Core polling controls
    start: startSmartPolling,
    startLeaderboard: startLeaderboardPolling,
    startTransitions: startTournamentTransitionPolling,
    stopLeaderboard: stopLeaderboardPolling,
    stopTransitions: stopTournamentTransitionPolling,

    // Status and diagnostics
    status: getPollingStatus,
    diagnostics: logPollingDiagnostics,

    // Manual operations
    checkTransitions: checkTournamentTransitions,
    manualRefresh: manualRefreshLeaderboard,

    // Development testing
    testApi: testApiData,
  };

  console.log(
    "🛠️ Development polling utilities available at window.pollingUtils",
  );
  console.log(
    "📋 Available methods:",
    Object.keys(windowWithUtils.pollingUtils || {}),
  );
}

// =====================================================
// Production Debugging
// =====================================================

/**
 * Global diagnostics function for production debugging
 * Always available regardless of environment
 */
if (typeof window !== "undefined") {
  const windowWithDiagnostics = window as Window & {
    pollingDiagnostics?: () => unknown;
  };

  windowWithDiagnostics.pollingDiagnostics = logPollingDiagnostics;
}
