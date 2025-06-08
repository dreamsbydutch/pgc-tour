/**
 * Legacy Polling Hooks
 * 
 * Backward compatibility for components that used the old polling hooks
 */

import { useEffect, useRef } from 'react';
import { startLeaderboardPolling } from './polling';
import { useLeaderboardStore } from './store';

/**
 * Legacy hook for leaderboard polling
 * @deprecated Use startLeaderboardPolling directly instead
 */
export function useLeaderboardPolling({
  enabled = true,
  refetchInterval = 300000,
  onSuccess,
  onError,
}: {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) {
  const cleanupRef = useRef<(() => void) | null>(null);
  const leaderboardState = useLeaderboardStore();
  
  useEffect(() => {
    if (enabled) {
      console.warn('🔄 useLeaderboardPolling is deprecated, use startLeaderboardPolling directly');
      
      // Start polling and store cleanup function
      cleanupRef.current = startLeaderboardPolling(refetchInterval);
      
      // Call success callback initially if we have data
      if (leaderboardState.teams || leaderboardState.golfers) {
        onSuccess?.();
      }
    }
    
    // Cleanup on unmount or when disabled
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [leaderboardState.golfers, leaderboardState.teams, onSuccess, enabled, refetchInterval]);
  
  // Return shape that matches old hook
  return {
    data: {
      teams: leaderboardState.teams,
      golfers: leaderboardState.golfers,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: async () => {
      try {
        const { refreshLeaderboard } = await import('./init');
        await refreshLeaderboard();
        onSuccess?.();
      } catch (error) {
        onError?.(error as Error);
      }
    },
    isRefetching: leaderboardState.isPolling,
  };
}

/**
 * Manual refresh trigger for components
 */
export async function triggerLeaderboardRefresh(): Promise<void> {
  try {
    const { refreshLeaderboard } = await import('./init');
    await refreshLeaderboard();
  } catch (error) {
    console.error('Manual leaderboard refresh failed:', error);
    throw error;
  }
}
