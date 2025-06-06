/**
 * Streamlined Store Initialization Hook
 * 
 * Simple and reliable store initialization without complex coordination layers
 * Focuses on essential functionality with clear error handling
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMainStore } from '../store/store';
import { loadInitialData, refreshTournamentData, initUtils } from '../store/mainInit';
import { 
  startLeaderboardPolling, 
  stopLeaderboardPolling, 
  shouldPollLeaderboard 
} from '../store/leaderboard';
import { useAuth } from '../auth/Auth';

interface InitializationState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  retryCount: number;
  lastInitialized: number | null;
}

interface UseInitStoreOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  skipInitialLoad?: boolean;
  enableLeaderboardPolling?: boolean;
}

const DEFAULT_OPTIONS: Required<UseInitStoreOptions> = {
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 2000,
  skipInitialLoad: false,
  enableLeaderboardPolling: true,
};

export function useInitStore(options: UseInitStoreOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [initState, setInitState] = useState<InitializationState>({
    isLoading: false,
    isInitialized: false,
    error: null,
    retryCount: 0,
    lastInitialized: null,
  });

  const { member, isAuthenticated, isLoading: authLoading } = useAuth();
  const store = useMainStore();
  const initializationRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaderboardCleanupRef = useRef<(() => void) | null>(null);

  // Check if store has been initialized recently
  const isStoreInitialized = useCallback(() => {
    const storeLastUpdated = store._lastUpdated;
    if (!storeLastUpdated) return false;
    
    // Consider initialized if updated within last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return storeLastUpdated > fiveMinutesAgo;
  }, [store._lastUpdated]);

  // Initialize store data
  const initializeStore = useCallback(async (retryAttempt = 0): Promise<void> => {
    if (initializationRef.current) {
      console.log('⏳ Store initialization already in progress, skipping...');
      return;
    }

    initializationRef.current = true;
    
    setInitState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      retryCount: retryAttempt,
    }));

    try {
      console.log('🔄 Initializing store...');
      
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Load initial data
      await loadInitialData();

      // Update initialization state
      setInitState({
        isLoading: false,
        isInitialized: true,
        error: null,
        retryCount: retryAttempt,
        lastInitialized: Date.now(),
      });

      console.log('✅ Store initialization completed successfully');

      // Start leaderboard polling for current tournament if enabled
      if (opts.enableLeaderboardPolling) {
        const currentTournament = useMainStore.getState().currentTournament;
        
        if (currentTournament && shouldPollLeaderboard(currentTournament)) {
          console.log('🔄 Starting leaderboard polling...');
          const cleanup = startLeaderboardPolling(parseInt(currentTournament.id), 300000); // 5 minutes
          leaderboardCleanupRef.current = cleanup;
        }
      }

    } catch (error) {
      console.error('❌ Store initialization failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Store initialization failed';
      
      setInitState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        retryCount: retryAttempt,
      }));

      // Auto-retry if enabled and within retry limit
      if (opts.autoRetry && retryAttempt < opts.maxRetries) {
        const nextAttempt = retryAttempt + 1;
        const delay = opts.retryDelay * Math.pow(1.5, retryAttempt); // Exponential backoff
        
        console.log(`⏳ Retrying store initialization in ${delay}ms... (attempt ${nextAttempt}/${opts.maxRetries})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          void initializeStore(nextAttempt);
        }, delay);
      }
    } finally {
      initializationRef.current = false;
    }
  }, [opts.autoRetry, opts.maxRetries, opts.retryDelay, opts.enableLeaderboardPolling]);

  // Manual retry function
  const retryInitialization = useCallback(() => {
    console.log('🔄 Manual retry of store initialization requested');
    void initializeStore(0);
  }, [initializeStore]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refresh of store data requested');
    
    try {
      setInitState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Reset store and reinitialize
      useMainStore.getState().reset();
      await initializeStore(0);
      
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      setInitState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Force refresh failed',
      }));
    }
  }, [initializeStore]);

  // Refresh just tournament data
  const refreshTournaments = useCallback(async () => {
    console.log('🔄 Refreshing tournament data...');
    
    try {
      await refreshTournamentData();
      console.log('✅ Tournament data refreshed');
    } catch (error) {
      console.error('❌ Tournament data refresh failed:', error);
    }
  }, []);

  // Initialize on mount and auth changes
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) {
      console.log('⏳ Waiting for auth to finish loading...');
      return;
    }

    // Skip if explicitly disabled
    if (opts.skipInitialLoad) {
      console.log('⏭️ Skipping initial load (disabled by options)');
      return;
    }

    // Skip if already initialized recently
    if (isStoreInitialized()) {
      console.log('✅ Store already initialized recently, skipping...');
      setInitState(prev => ({
        ...prev,
        isInitialized: true,
        lastInitialized: store._lastUpdated,
      }));
      return;
    }

    // Initialize store
    console.log('🚀 Starting store initialization...', {
      authLoaded: !authLoading,
      isAuthenticated,
      memberEmail: member?.email,
    });
    
    void initializeStore(0);
  }, [authLoading, isAuthenticated, member?.id, member?.email, isStoreInitialized, initializeStore, opts.skipInitialLoad, store._lastUpdated]);

  // Update leaderboard polling when tournament changes
  useEffect(() => {
    if (!opts.enableLeaderboardPolling) return;

    const currentTournament = store.currentTournament;
    
    // Stop existing polling
    if (leaderboardCleanupRef.current) {
      leaderboardCleanupRef.current();
      leaderboardCleanupRef.current = null;
    }
    
    // Start new polling if tournament should be polled
    if (currentTournament && shouldPollLeaderboard(currentTournament)) {
      console.log('🔄 Starting leaderboard polling for new tournament...');
      const cleanup = startLeaderboardPolling(parseInt(currentTournament.id), 300000);
      leaderboardCleanupRef.current = cleanup;
    }
  }, [store.currentTournament?.id, store.currentTournament, opts.enableLeaderboardPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (leaderboardCleanupRef.current) {
        console.log('🛑 Cleaning up leaderboard polling on unmount');
        leaderboardCleanupRef.current();
        leaderboardCleanupRef.current = null;
      }
    };
  }, []);

  // Return initialization state and control functions
  return {
    // State
    ...initState,
    isAuthLoaded: !authLoading,
    hasStoreData: isStoreInitialized(),
    
    // Control functions
    retry: retryInitialization,
    forceRefresh,
    refreshTournaments,
    
    // Store access
    store,
    
    // Utils
    getStatus: initUtils.getStatus,
  };
}

// Simple hook for components that just need to know if store is ready
export function useStoreReady() {
  const store = useMainStore();
  const { isLoading: authLoading } = useAuth();
  
  const isReady = !authLoading && 
                  !!store._lastUpdated && 
                  !!store.seasonTournaments?.length && 
                  !!store.tourCards?.length;
  
  return {
    isReady,
    isLoading: authLoading || !store._lastUpdated,
    hasData: !!store.seasonTournaments?.length,
  };
}

// Reset functions for admin use
export function resetInitialization() {
  console.log('🔄 Resetting main store initialization state');
  
  const store = useMainStore.getState();
  store.reset();
  
  console.log('✅ Main store initialization reset complete');
}

export function resetLeaderboardInitialization() {
  console.log('🔄 Resetting leaderboard store initialization state');
  
  stopLeaderboardPolling();
  
  console.log('✅ Leaderboard store initialization reset complete');
}
