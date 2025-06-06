/**
 * Streamlined Store Initialization
 * 
 * Single source of truth for loading and initializing all store data
 * Simplified approach without complex coordination layers
 */

import type {
  Course,
  Golfer,
  Member,
  Season,
  Team,
  Tier,
  Tour,
  TourCard,
  Tournament,
} from "@prisma/client";
import { useMainStore } from "./store";

type TournamentData = Tournament & {
  course: Course | null;
};

type ProcessedTournament = TournamentData & {
  golfers: Golfer[];
  teams: (Team & { tourCard: TourCard | null })[];
};

// Fetch utilities with proper error handling
async function safeFetch<T>(url: string, timeout = 10000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      cache: 'no-store' // Always fetch fresh data
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`❌ API Error ${url}: ${response.status}`);
      return null;
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`💥 Fetch failed ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

// Load core application data
async function loadCoreData() {
  console.log('📦 Loading core application data...');
  
  const [
    tourCardsResponse,
    toursResponse,
    seasonsResponse,
    tiersResponse,
  ] = await Promise.all([
    safeFetch<{ tourCards: TourCard[] }>('/api/tour-cards'),
    safeFetch<{ tours: Tour[] }>('/api/tours'),
    safeFetch<{ seasons: Season[] }>('/api/seasons'),
    safeFetch<{ tiers: Tier[] }>('/api/tiers'),
  ]);

  return {
    tourCards: tourCardsResponse?.tourCards ?? [],
    tours: toursResponse?.tours ?? [],
    seasons: seasonsResponse?.seasons ?? [],
    tiers: tiersResponse?.tiers ?? [],
  };
}

// Load tournament data
async function loadTournamentData() {
  console.log('🏆 Loading tournament data...');
  
  const [tournamentResponse, pastTournamentsResponse] = await Promise.all([
    safeFetch<{ tournaments: TournamentData[] }>('/api/tournaments'),
    safeFetch<{ tournaments: ProcessedTournament[] }>('/api/tournaments/past'),
  ]);

  return {
    seasonTournaments: tournamentResponse?.tournaments ?? [],
    pastTournaments: pastTournamentsResponse?.tournaments ?? [],
  };
}

// Determine current tournament state
function updateTournamentState(tournaments: TournamentData[]) {
  if (!tournaments.length) {
    return { currentTournament: null, nextTournament: null };
  }

  const now = new Date();
  const sortedTournaments = [...tournaments].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Find current tournament (started but not ended, and not completed)
  const currentTournament = sortedTournaments.find(
    t => new Date(t.startDate) <= now && 
         new Date(t.endDate) >= now && 
         (t.currentRound ?? 0) < 5
  ) ?? null;

  // Find next tournament (not yet started)
  const nextTournament = sortedTournaments.find(
    t => new Date(t.startDate) > now
  ) ?? null;

  return { currentTournament, nextTournament };
}

// Main initialization function
export async function loadInitialData(): Promise<void> {
  console.log('🚀 Starting store initialization...');
  
  try {
    // Load core data and tournaments in parallel
    const [coreData, tournamentData] = await Promise.all([
      loadCoreData(),
      loadTournamentData(),
    ]);

    // Determine current/next tournaments
    const { currentTournament, nextTournament } = updateTournamentState(
      tournamentData.seasonTournaments
    );

    // Get current season (most recent)
    const currentSeason = coreData.seasons.length > 0 
      ? coreData.seasons.sort((a, b) => b.year - a.year)[0] 
      : null;

    // Initialize the store with all data
    const initData = {
      ...coreData,
      ...tournamentData,
      currentTournament,
      nextTournament,
      currentSeason,
      currentTiers: coreData.tiers,
    };

    useMainStore.getState().initializeData(initData);
    
    console.log('✅ Store initialization completed successfully');
  } catch (error) {
    console.error('❌ Store initialization failed:', error);
    throw error;
  }
}

// Refresh specific data sections
export async function refreshTournamentData(): Promise<void> {
  console.log('🔄 Refreshing tournament data...');
  
  try {
    const tournamentData = await loadTournamentData();
    const { currentTournament, nextTournament } = updateTournamentState(
      tournamentData.seasonTournaments
    );

    useMainStore.getState().initializeData({
      ...tournamentData,
      currentTournament,
      nextTournament,
    });
    
    console.log('✅ Tournament data refreshed');
  } catch (error) {
    console.error('❌ Tournament data refresh failed:', error);
    throw error;
  }
}

export async function refreshUserData(member: Member): Promise<void> {
  console.log('👤 Refreshing user-specific data...');
  
  try {
    const state = useMainStore.getState();
    
    // Find user's tour card and tour
    const userTourCard = state.tourCards?.find(tc => tc.memberId === member.id) ?? null;
    const _userTour = userTourCard 
      ? state.tours?.find(t => t.id === userTourCard.tourId) ?? null 
      : null;

    // Update auth state with user data
    state.setAuthState(member, true);
    
    console.log('✅ User data refreshed');
  } catch (error) {
    console.error('❌ User data refresh failed:', error);
    throw error;
  }
}

// Development utilities
export const initUtils = {
  // Force complete refresh
  forceRefresh: async () => {
    console.log('🔄 Force refreshing all data...');
    
    // Clear store state
    useMainStore.getState().reset();
    
    // Reload everything
    await loadInitialData();
  },
  
  // Get initialization status
  getStatus: () => {
    const state = useMainStore.getState();
    return {
      hasData: !!(state.seasonTournaments?.length && state.tourCards?.length),
      isAuthenticated: state.isAuthenticated,
      currentTournament: state.currentTournament?.name ?? "None",
      nextTournament: state.nextTournament?.name ?? "None",
      lastUpdated: state._lastUpdated,
      dataAge: state._lastUpdated ? Date.now() - state._lastUpdated : null,
    };
  },
};

// Make available in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).initUtils = initUtils;
}
