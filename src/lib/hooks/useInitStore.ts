/**
 * Streamlined Store Initialization Hook
 * 
 * Simple and reliable store initialization without complex coordination layers
 * Focuses on essential functionality with clear error handling
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMainStore } from '../store/store';
import { loadInitialData } from '../store/mainInit';
import { 
  startLeaderboardPolling, 
  shouldPollLeaderboard 
} from '../store/leaderboard';
import { startTournamentTransitionPolling } from '../store/transitions';
import { useAuth } from '../auth/Auth';
import { log, perf } from '@/src/lib/logging';

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
  const transitionsCleanupRef = useRef<(() => void) | null>(null);

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
      log.store.info('Store initialization already in progress, skipping...');
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
      const endTimer = perf.start('Store initialization');
      log.store.init('Initializing store...', { retryAttempt });
      
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Load initial data
      await loadInitialData();
      
      endTimer(); // End performance measurement

      // Update initialization state
      setInitState({
        isLoading: false,
        isInitialized: true,
        error: null,
        retryCount: retryAttempt,
        lastInitialized: Date.now(),
      });

      log.store.info('Store initialization completed successfully');

      // Start tournament transition polling
      if (!transitionsCleanupRef.current) {
        log.store.info('Starting tournament transition polling...');
        const cleanup = startTournamentTransitionPolling(300000); // 5 minutes
        transitionsCleanupRef.current = cleanup;
      }

      // Start leaderboard polling for current tournament if enabled
      if (opts.enableLeaderboardPolling) {
        const currentTournament = useMainStore.getState().currentTournament;
        
        if (currentTournament && shouldPollLeaderboard(currentTournament)) {
          log.store.info('Starting leaderboard polling...');
          const tournamentId = currentTournament.id
          const cleanup = startLeaderboardPolling(tournamentId, 300000); // 5 minutes
          leaderboardCleanupRef.current = cleanup;
        }
      }

    } catch (error) {
      log.store.error('Store initialization failed', error as Error);
      
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
        
        log.store.init(`Retrying store initialization in ${delay}ms...`, { 
          retryAttempt: nextAttempt, 
          maxRetries: opts.maxRetries 
        });
        
        retryTimeoutRef.current = setTimeout(() => {
          void initializeStore(nextAttempt);
        }, delay);
      }
    } finally {
      initializationRef.current = false;
    }
  }, [opts.autoRetry, opts.maxRetries, opts.retryDelay, opts.enableLeaderboardPolling]);

  // Manual retry function
  const retryInitialization = () => {
    log.store.info('Manual retry of store initialization requested');
    void initializeStore(0);
  };

  // Force refresh function
  const forceRefresh = async () => {
    log.store.info('Force refresh of store data requested');
    
    try {
      setInitState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Reset store to initial state
      useMainStore.setState({
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
        isAuthenticated: false,
        authLastUpdated: null,
        _lastUpdated: null,
      });
      
      // Reinitialize after reset
      void initializeStore(0);
    } catch (error) {
      log.store.error('Force refresh failed', error as Error);
      setInitState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Force refresh failed',
      }));
    }
  };

  // Initialize on mount and auth changes
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) {
      log.store.info('Waiting for auth to finish loading...');
      return;
    }

    // Skip if explicitly disabled
    if (opts.skipInitialLoad) {
      log.store.info('Skipping initial load (disabled by options)');
      return;
    }

    // Skip if already initialized recently
    if (isStoreInitialized()) {
      log.store.info('Store already initialized recently, skipping...');
      setInitState(prev => ({
        ...prev,
        isInitialized: true,
        lastInitialized: store._lastUpdated,
      }));
      return;
    }

    // Initialize store
    log.store.info('Starting store initialization...', {
      authLoaded: !authLoading,
      isAuthenticated,
      memberEmail: member?.email?.split('@')[0] + '@***' // Mask email for privacy
    });
    
    void initializeStore(0);
  }, [authLoading, isAuthenticated, member?.id, member?.email, store._lastUpdated, isStoreInitialized, initializeStore, opts.skipInitialLoad]); // Include all dependencies

  // Register for auth state changes
  useEffect(() => {
    // When auth state changes, we may need to reinitialize
    if (isAuthenticated && !initState.isInitialized && !authLoading) {
      console.log('🔄 Auth state changed, checking if reinitialization needed');
      if (!isStoreInitialized()) {
        void initializeStore(0);
      }
    }
  }, [isAuthenticated, authLoading, initState.isInitialized, isStoreInitialized, initializeStore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (transitionsCleanupRef.current) {
        console.log('🛑 Cleaning up tournament transition polling on unmount');
        transitionsCleanupRef.current();
        transitionsCleanupRef.current = null;
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
    
    // Store access
    store,
  };
}

/**
 * Reset the main store initialization state
 * Used by admin utilities to force re-initialization
 */
export function resetInitialization() {
  console.log('🔄 Resetting main store initialization state');
  
  // Reset store data to initial state
  useMainStore.setState({
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
    isAuthenticated: false,
    authLastUpdated: null,
    _lastUpdated: null,
  });
  
  console.log('✅ Main store initialization reset complete');
}
