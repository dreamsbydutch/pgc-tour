/**
 * Streamlined Leaderboard Store Initialization
 * 
 * Simple polling and data management for live tournament leaderboards
 */

import type { Team, TourCard, Golfer } from "@prisma/client";
import { useLeaderboardStore } from "./store";

type LeaderboardTeam = Team & { tourCard: TourCard | null };

// Fetch leaderboard data
async function fetchLeaderboardData(tournamentId: number): Promise<{
  teams: LeaderboardTeam[];
  golfers: Golfer[];
} | null> {
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}/leaderboard`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`❌ Leaderboard API Error: ${response.status}`);
      return null;
    }
    
    const data = await response.json() as {
      teams: LeaderboardTeam[];
      golfers: Golfer[];
    };
    
    return data;
  } catch (error) {
    console.error('💥 Leaderboard fetch failed:', error);
    return null;
  }
}

// Initialize leaderboard for a tournament
export async function initializeLeaderboard(tournamentId: number): Promise<void> {
  console.log(`📊 Initializing leaderboard for tournament ${tournamentId}...`);
  
  try {
    const data = await fetchLeaderboardData(tournamentId);
    
    if (data) {
      useLeaderboardStore.getState().update(data.teams, data.golfers);
      console.log('✅ Leaderboard initialized successfully');
    } else {
      throw new Error('Failed to fetch leaderboard data');
    }
  } catch (error) {
    console.error('❌ Leaderboard initialization failed:', error);
    throw error;
  }
}

// Refresh leaderboard data
export async function refreshLeaderboard(tournamentId: number): Promise<void> {
  try {
    const data = await fetchLeaderboardData(tournamentId);
    
    if (data) {
      useLeaderboardStore.getState().update(data.teams, data.golfers);
      console.log('✅ Leaderboard refreshed');
    }
  } catch (error) {
    console.error('❌ Leaderboard refresh failed:', error);
    // Don't throw on refresh failures to avoid disrupting polling
  }
}

// Start polling for live updates during active tournaments
let pollingInterval: NodeJS.Timeout | null = null;

export function startLeaderboardPolling(
  tournamentId: number, 
  intervalMs = 300000 // 5 minutes default
): () => void {
  console.log(`🔄 Starting leaderboard polling for tournament ${tournamentId} (${intervalMs}ms interval)`);
  
  // Clear any existing polling
  stopLeaderboardPolling();
  
  // Set polling state
  useLeaderboardStore.getState().setPolling(true);
  
  // Start polling
  pollingInterval = setInterval(() => {
    void refreshLeaderboard(tournamentId);
  }, intervalMs);
  
  // Return cleanup function
  return stopLeaderboardPolling;
}

export function stopLeaderboardPolling(): void {
  if (pollingInterval) {
    console.log('🛑 Stopping leaderboard polling');
    clearInterval(pollingInterval);
    pollingInterval = null;
    useLeaderboardStore.getState().setPolling(false);
  }
}

// Check if leaderboard should be actively polling
export function shouldPollLeaderboard(tournament: { startDate: string | Date; endDate: string | Date; currentRound?: number | null }): boolean {
  if (!tournament) return false;
  
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);
  
  // Poll if tournament is active and not completed
  return startDate <= now && 
         endDate >= now && 
         (tournament.currentRound ?? 0) < 5;
}

// Legacy hook support for components that still use it
export function useLeaderboardPolling({
  enabled: _enabled = true,
  refetchInterval: _refetchInterval = 300000,
  onSuccess: _onSuccess,
  onError: _onError,
}: {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) {
  console.warn('🔄 useLeaderboardPolling is deprecated, use startLeaderboardPolling directly');
  
  return {
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve(),
    isRefetching: false,
  };
}

// Leaderboard utilities
export const leaderboardUtils = {
  // Manual refresh
  refresh: async (tournamentId: number) => {
    await refreshLeaderboard(tournamentId);
  },
  
  // Start/stop polling
  startPolling: startLeaderboardPolling,
  stopPolling: stopLeaderboardPolling,
  
  // Get current state
  getStatus: () => {
    const state = useLeaderboardStore.getState();
    return {
      hasData: !!(state.teams?.length ?? state.golfers?.length),
      isPolling: state.isPolling,
      lastUpdated: state._lastUpdated,
      dataAge: state._lastUpdated ? Date.now() - state._lastUpdated : null,
    };
  },
  
  // Reset leaderboard
  reset: () => {
    stopLeaderboardPolling();
    useLeaderboardStore.getState().reset();
  },
};

// Make available in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).leaderboardUtils = leaderboardUtils;
}
