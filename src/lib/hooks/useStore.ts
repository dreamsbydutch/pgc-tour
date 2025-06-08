/**
 * Store Utility Hooks
 * 
 * Provides convenient hooks for common store operations
 */

import { useCallback, useMemo } from 'react';
import { useMainStore, useLeaderboardStore } from '../store/store';
import { refreshTournamentData } from '../store/init';
import { stopLeaderboardPolling, stopTournamentTransitionPolling } from '../store/polling';
import { useAuth } from '../auth/Auth';

/**
 * Store Ready Check Hook
 * Simple hook for components that just need to know if store is ready
 */
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

/**
 * Tournament Data Hook
 * Provides tournament-specific functionality
 */
export function useTournamentData() {
  const store = useMainStore();
  
  const refreshTournaments = useCallback(async () => {
    console.log('🔄 Refreshing tournament data...');
    
    try {
      await refreshTournamentData();
      console.log('✅ Tournament data refreshed');
    } catch (error) {
      console.error('❌ Tournament data refresh failed:', error);
    }
  }, []);

  return {
    currentTournament: store.currentTournament,
    nextTournament: store.nextTournament,
    seasonTournaments: store.seasonTournaments,
    pastTournaments: store.pastTournaments,
    refreshTournaments,
  };
}

/**
 * Leaderboard Data Hook
 * Provides leaderboard-specific functionality
 */
export function useLeaderboardData() {
  const leaderboard = useLeaderboardStore();
  
  return {
    teams: leaderboard.teams,
    golfers: leaderboard.golfers,
    isPolling: leaderboard.isPolling,
    lastUpdated: leaderboard._lastUpdated,
  };
}

/**
 * Member Data Hook
 * Provides member-specific functionality
 */
export function useMemberData() {
  const store = useMainStore();
  const { member } = useAuth();
  
  return useMemo(() => ({
    currentMember: store.currentMember,
    currentTour: store.currentTour,
    currentTourCard: store.currentTourCard,
    isAuthenticated: store.isAuthenticated,
    isMember: !!member,
  }), [store.currentMember, store.currentTour, store.currentTourCard, store.isAuthenticated, member]);
}

/**
 * Season Data Hook
 * Provides season-specific functionality
 */
export function useSeasonData() {
  const store = useMainStore();
  
  return useMemo(() => ({
    currentSeason: store.currentSeason,
    seasonTournaments: store.seasonTournaments,
    tours: store.tours,
    tourCards: store.tourCards,
    tiers: store.currentTiers,
  }), [store.currentSeason, store.seasonTournaments, store.tours, store.tourCards, store.currentTiers]);
}

/**
 * Reset functions for admin use
 */
export function resetStoreInitialization() {
  console.log('🔄 Resetting main store initialization state');
  
  const store = useMainStore.getState();
  store.reset();
  
  console.log('✅ Main store initialization reset complete');
}

export function resetLeaderboardInitialization() {
  console.log('🔄 Resetting leaderboard store initialization state');
  
  stopLeaderboardPolling();
  stopTournamentTransitionPolling();
  
  console.log('✅ Leaderboard store initialization reset complete');
}
