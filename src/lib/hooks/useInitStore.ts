/**
 * Enhanced Store Initialization Hook with Data Flow Coordination
 * 
 * Integrates with the comprehensive authentication and cache coordination system
 * Provides unified initialization with proper error handling and coordination
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMainStore, useLeaderboardStore } from '../store/store';
import { loadInitialData } from '../store/mainInit';
import { dataFlowCoordinator } from '../coordination/DataFlowCoordinator';
// Removed unused import: authStoreService
import { useAuth } from '../auth/AuthContext';

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
}

const DEFAULT_OPTIONS: Required<UseInitStoreOptions> = {
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 2000,
  skipInitialLoad: false,
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

  // Check if store has been initialized recently
  const isStoreInitialized = useCallback(() => {
    const storeLastUpdated = store._lastUpdated;
    if (!storeLastUpdated) return false;
    
    // Consider initialized if updated within last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return storeLastUpdated > fiveMinutesAgo;
  }, [store._lastUpdated]);

  // Initialize store data with coordination
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
      console.log('🔄 Initializing store with data flow coordination...');
      
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Load initial data with coordination
      await loadInitialData();

      // Coordinate with auth system if user is authenticated
      if (isAuthenticated && member) {
        console.log('🔄 Coordinating with authenticated user state...');
        await dataFlowCoordinator.handleAuthChange(member, true, 'init-store');
      }

      // Update initialization state
      setInitState({
        isLoading: false,
        isInitialized: true,
        error: null,
        retryCount: retryAttempt,
        lastInitialized: Date.now(),
      });

      console.log('✅ Store initialization completed successfully');

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
  }, [isAuthenticated, member, opts.autoRetry, opts.maxRetries, opts.retryDelay]);

  // Manual retry function
  const retryInitialization = () => {
    console.log('🔄 Manual retry of store initialization requested');
    void initializeStore(0);
  };

  // Force refresh function
  const forceRefresh = async () => {
    console.log('🔄 Force refresh of store data requested');
    
    try {
      setInitState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use data flow coordinator for complete reset
      const result = await dataFlowCoordinator.performCompleteReset();
      
      if (result.success) {
        // Reinitialize after reset
        void initializeStore(0);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
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
  }, [authLoading, isAuthenticated, member?.id, member?.email, store._lastUpdated, isStoreInitialized, initializeStore, opts.skipInitialLoad]); // Include all dependencies

  // Register for data flow coordination events
  useEffect(() => {
    const unsubscribe = dataFlowCoordinator.onCoordinationEvent((event) => {
      console.log('📡 Data flow coordination event:', event.type, event.source);
      
      // Update initialization state based on coordination events
      if (event.type === 'cache-invalidation' && typeof event.data === 'object' && event.data && event.data.type === 'global') {
        console.log('🔄 Global cache invalidation detected, marking for refresh');
        setInitState(prev => ({ ...prev, isInitialized: false }));
      }
    });

    return unsubscribe;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
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
    
    // Coordination status
    coordinationStatus: dataFlowCoordinator.getCoordinationStatus(),
  };
}

/**
 * Reset the main store initialization state
 * Used by admin utilities to force re-initialization
 */
export function resetInitialization() {
  console.log('🔄 Resetting main store initialization state');
  
  // Reset store data to initial state
  const _store = useMainStore.getState();
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

/**
 * Reset the leaderboard store initialization state
 * Used by admin utilities to force re-initialization
 */
export function resetLeaderboardInitialization() {
  console.log('🔄 Resetting leaderboard store initialization state');
  
  // Reset leaderboard store data to initial state
  useLeaderboardStore.setState({
    teams: null,
    golfers: null,
    _lastUpdated: null,
    isPolling: false,
  });
  
  console.log('✅ Leaderboard store initialization reset complete');
}
