/**
 * Streamlined Store Initialization Hook
 * 
 * Simple and reliable store initialization without complex coordination layers
 * Focuses on essential functionality with clear error handling
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMainStore } from '../store/store';
import { initializeStore } from '../store/init';
import { startSmartPolling } from '../store/polling';
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
  const pollingCleanupRef = useRef<(() => void) | null>(null);

  // Check if store is already initialized
  const isStoreInitialized = useCallback(() => {
    return !!(
      store.currentSeason &&
      store.tours && store.tours.length > 0 &&
      store.tourCards && store.tourCards.length > 0
    );
  }, [store.currentSeason, store.tours, store.tourCards]);

  // Initialize store with proper error handling and performance tracking
  const initializeStoreData = useCallback(async (retryAttempt = 0) => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    setInitState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      await initializeStore();

      setInitState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
        error: null,
        retryCount: 0,
        lastInitialized: Date.now(),
      }));

      // Start polling system if enabled
      if (opts.enableLeaderboardPolling) {
        if (pollingCleanupRef.current) {
          pollingCleanupRef.current();
        }
        pollingCleanupRef.current = startSmartPolling();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Store initialization failed';
      
      setInitState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: false,
        error: errorMessage,
        retryCount: retryAttempt + 1,
      }));

      // Auto retry if enabled and under max retries
      if (opts.autoRetry && retryAttempt < opts.maxRetries) {
        const delay = opts.retryDelay * Math.pow(2, retryAttempt); // exponential backoff
        setTimeout(() => {
          initializationRef.current = false;
          void initializeStoreData(retryAttempt + 1);
        }, delay);
      }
    } finally {
      initializationRef.current = false;
    }
  }, [opts.autoRetry, opts.enableLeaderboardPolling, opts.maxRetries, opts.retryDelay]);

  // Manual retry function
  const retryInitialization = useCallback(() => {
    setInitState(prev => ({ ...prev, retryCount: 0, error: null }));
    void initializeStoreData();
  }, [initializeStoreData]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    try {
      setInitState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        lastInitialized: null,
      }));

      // Reset store state using the reset action
      useMainStore.getState().reset();

      // Force re-initialization
      await initializeStoreData();
    } catch (error: unknown) {
      setInitState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Force refresh failed',
        isLoading: false,
      }));
    }
  }, [initializeStoreData]);

  // Main initialization effect
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Skip if disabled by options
    if (opts.skipInitialLoad) {
      return;
    }

    // Skip if already initialized recently (within 5 minutes)
    if (isStoreInitialized()) {
      setInitState(prev => ({ ...prev, isInitialized: true }));
      return;
    }

    // Initialize store
    void initializeStoreData();
  }, [authLoading, opts.skipInitialLoad, initializeStoreData, isStoreInitialized]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (pollingCleanupRef.current) {
        pollingCleanupRef.current();
        pollingCleanupRef.current = null;
      }
    };
  }, []);

  return {
    ...initState,
    member,
    isAuthenticated,
    retryInitialization,
    forceRefresh,
    // Helper methods
    canRetry: initState.retryCount < opts.maxRetries,
    hasRecentError: !!initState.error && Date.now() - (initState.lastInitialized ?? 0) < 30000,
  };
}

// Store initialization status hook for components that need simple status
export function useStoreStatus() {
  const store = useMainStore();
  const { isAuthenticated, member } = useAuth();

  return {
    isInitialized: !!(
      store.currentSeason &&
      store.tours && store.tours.length > 0 &&
      store.tourCards && store.tourCards.length > 0
    ),
    isAuthenticated,
    member,
    lastUpdated: store._lastUpdated,
  };
}

// Simple initialization hook for basic components
export function useSimpleInit() {
  const { isLoading, isInitialized, error } = useInitStore({
    skipInitialLoad: false,
    enableLeaderboardPolling: false,
  });

  return {
    isLoading,
    isInitialized,
    hasError: !!error,
  };
}
