/**
 * Store Initialization Module
 *
 * This module serves as the single source of truth for loading and initializing
 * all store data in the PGC Tour application. It handles:
 * - Initial data loading from APIs
 * - Store state management and updates
 * - Real-time leaderboard polling during tournaments
 * - Tournament state transitions
 * - Error handling and fallback strategies
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
import { useMainStore, useLeaderboardStore } from "./store";

// =====================================================
// Type Definitions
// =====================================================

/**
 * Tournament data with associated course information
 */
type TournamentData = Tournament & {
  course: Course | null;
};

/**
 * Processed tournament with complete team and golfer data
 * Used for past tournaments that include leaderboard results
 */
type ProcessedTournament = TournamentData & {
  golfers: Golfer[];
  teams: (Team & { tourCard: TourCard | null })[];
};

/**
 * Team with tour card information for leaderboard display
 */
type LeaderboardTeam = Team & { tourCard: TourCard | null };

/**
 * Complete core application data structure
 */
interface CoreData {
  tourCards: TourCard[];
  tours: Tour[];
  season: Season;
  tiers: Tier[];
}

/**
 * Tournament data structure containing current and past tournaments
 */
interface TournamentDataSet {
  seasonTournaments: TournamentData[];
  pastTournaments: ProcessedTournament[];
}

/**
 * Leaderboard data structure
 */
interface LeaderboardData {
  teams: LeaderboardTeam[];
  golfers: Golfer[];
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Safe fetch utility with timeout and error handling
 *
 * @param url - API endpoint to fetch from
 * @param timeout - Request timeout in milliseconds (default: 10000)
 * @returns Promise resolving to parsed JSON data or null on error
 */
async function safeFetch<T>(url: string, timeout = 10000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store", // Ensure fresh data for store initialization
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`❌ API request failed: ${url} (${response.status})`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`❌ Network error for ${url}:`, error);
    return null;
  }
}

// =====================================================
// Data Loading Functions
// =====================================================

/**
 * Loads core application data required for basic functionality
 * Fetches tour cards, tours, seasons, and tiers in parallel
 *
 * @returns Promise resolving to core data structure with fallback empty arrays
 */
async function loadCoreData(): Promise<CoreData> {
  console.log("🔄 Loading core application data...");

  const [tourCardsResponse, toursResponse, seasonResponse, tiersResponse] =
    await Promise.all([
      safeFetch<{ tourCards: TourCard[] }>("/api/tourcards/current"),
      safeFetch<{ tours: Tour[] }>("/api/tours/all"),
      safeFetch<{ season: Season }>("/api/seasons/current"),
      safeFetch<{ tiers: Tier[] }>("/api/tiers/current"),
    ]);

  const coreData = {
    tourCards: tourCardsResponse?.tourCards ?? [],
    tours: toursResponse?.tours ?? [],
    season: seasonResponse?.season ?? {
      id: "",
      year: 0,
      number: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tiers: tiersResponse?.tiers ?? [],
  };

  console.log("✅ Core data loaded:", {
    tourCards: coreData.tourCards.length,
    tours: coreData.tours.length,
    seasons: Array.isArray(coreData.season) ? coreData.season.length : 0,
    tiers: coreData.tiers.length,
  });

  return coreData;
}

/**
 * Loads tournament data including current season and past tournaments
 *
 * @returns Promise resolving to tournament data structure
 */
async function loadTournamentData(): Promise<TournamentDataSet> {
  console.log("🔄 Loading tournament data...");

  const [tournamentResponse, pastTournamentsResponse] = await Promise.all([
    safeFetch<{ tournaments: TournamentData[] }>("/api/tournaments/all"),
    safeFetch<{ tournaments: ProcessedTournament[] }>("/api/tournaments/past"),
  ]);

  const tournamentData = {
    seasonTournaments: tournamentResponse?.tournaments ?? [],
    pastTournaments: pastTournamentsResponse?.tournaments ?? [],
  };

  console.log("✅ Tournament data loaded:", {
    seasonTournaments: tournamentData.seasonTournaments.length,
    pastTournaments: tournamentData.pastTournaments.length,
  });

  return tournamentData;
}

/**
 * Loads fresh leaderboard data with cache-busting headers
 * Used for real-time tournament leaderboard updates
 *
 * @returns Promise resolving to leaderboard data or null on error
 */
async function loadLeaderboardData(): Promise<LeaderboardData | null> {
  try {
    console.log("🔄 Loading leaderboard data...");

    // Add timestamp to bust cache for real-time data
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

    if (!response.ok) {
      console.warn(`❌ Leaderboard fetch failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as LeaderboardData;
    console.log("✅ Leaderboard data loaded:", {
      teams: data.teams?.length ?? 0,
      golfers: data.golfers?.length ?? 0,
    });

    return data;
  } catch (error) {
    console.error("❌ Leaderboard fetch error:", error);
    return null;
  }
}

// =====================================================
// Tournament State Management
// =====================================================

/**
 * Determines current and next tournament based on dates and status
 *
 * Business logic:
 * - Current tournament: started but not ended, and not completed (< 5 rounds)
 * - Next tournament: first tournament with start date in the future
 *
 * @param tournaments - Array of tournament data
 * @returns Object containing current and next tournament or null
 */
function updateTournamentState(tournaments: TournamentData[]): {
  currentTournament: TournamentData | null;
  nextTournament: TournamentData | null;
} {
  if (!tournaments.length) {
    console.log("ℹ️ No tournaments available");
    return { currentTournament: null, nextTournament: null };
  }

  const now = new Date();
  const sortedTournaments = [...tournaments].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  // Find current tournament (in progress)
  const currentTournament =
    sortedTournaments.find(
      (t) =>
        new Date(t.startDate) <= now &&
        new Date(t.endDate) >= now &&
        (t.currentRound ?? 0) < 5, // Tournament not completed
    ) ?? null;

  // Find next tournament (future start date)
  const nextTournament =
    sortedTournaments.find((t) => new Date(t.startDate) > now) ?? null;

  console.log("🏆 Tournament state:", {
    current: currentTournament?.name ?? "None",
    next: nextTournament?.name ?? "None",
  });

  return { currentTournament, nextTournament };
}

/**
 * Determines if leaderboard should be actively polling for updates
 *
 * @param tournament - Tournament to check
 * @returns True if tournament is active and should poll for updates
 */
export function shouldPollLeaderboard(tournament: {
  startDate: string | Date;
  endDate: string | Date;
  currentRound?: number | null;
}): boolean {
  if (!tournament) return false;

  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  const shouldPoll =
    startDate <= now && endDate >= now && (tournament.currentRound ?? 0) < 5;

  console.log(`🔄 Polling check:`, {
    shouldPoll,
    currentRound: tournament.currentRound,
    inDateRange: startDate <= now && endDate >= now,
  });

  return shouldPoll;
}

// =====================================================
// Main Initialization Functions
// =====================================================

/**
 * Main store initialization function
 *
 * Orchestrates the loading of all application data and initializes stores.
 * This is the primary entry point for application startup.
 *
 * Flow:
 * 1. Load core data and tournaments in parallel
 * 2. Determine current/next tournament state
 * 3. Initialize main store with all data
 * 4. Initialize leaderboard if tournament is active
 *
 * @throws Error if critical initialization fails
 */
export async function initializeStore(): Promise<void> {
  try {
    console.log("🚀 Starting store initialization...");

    // Load core data and tournaments in parallel for efficiency
    const [coreData, tournamentData] = await Promise.all([
      loadCoreData(),
      loadTournamentData(),
    ]);

    // Determine current/next tournaments based on loaded data
    const { currentTournament, nextTournament } = updateTournamentState(
      tournamentData.seasonTournaments,
    );

    // Get current season (most recent by year)
    const currentSeason = coreData.season;

    // Combine all data for store initialization
    const initData = {
      ...coreData,
      ...tournamentData,
      currentTournament,
      nextTournament,
      currentSeason,
      currentTiers: coreData.tiers,
    };

    // Initialize the main store with all data
    useMainStore.getState().initializeData(initData);
    console.log("✅ Main store initialized");

    // Initialize leaderboard if there's an active tournament
    if (currentTournament && shouldPollLeaderboard(currentTournament)) {
      console.log("🏆 Active tournament detected, initializing leaderboard...");
      await initializeLeaderboard().catch((error) => {
        console.warn("⚠️ Leaderboard initialization failed:", error);
        // Don't fail main initialization if leaderboard fails
      });
    }

    console.log("🎉 Store initialization complete");
  } catch (error) {
    console.error("❌ Store initialization failed:", error);
    throw error;
  }
}

/**
 * Initialize leaderboard store for active tournament
 *
 * @throws Error if leaderboard data cannot be loaded
 */
export async function initializeLeaderboard(): Promise<void> {
  try {
    const data = await loadLeaderboardData();

    if (data) {
      useLeaderboardStore.getState().update(data.teams, data.golfers);
      console.log("✅ Leaderboard store initialized");
    } else {
      throw new Error("Failed to fetch leaderboard data");
    }
  } catch (error) {
    console.error("❌ Leaderboard initialization failed:", error);
    throw error;
  }
}

// =====================================================
// Refresh Functions
// =====================================================

/**
 * Refreshes leaderboard data from API
 * Used for real-time updates during tournaments
 * Silent failure to avoid disrupting user experience
 */
export async function refreshLeaderboard(): Promise<void> {
  try {
    console.log("🔄 Starting leaderboard refresh...");
    const data = await loadLeaderboardData();

    if (data) {
      console.log("✅ Leaderboard data received:", {
        teams: data.teams?.length ?? 0,
        golfers: data.golfers?.length ?? 0,
        timestamp: new Date().toISOString(),
      });
      useLeaderboardStore.getState().update(data.teams, data.golfers);
      console.log("✅ Leaderboard store updated");
    } else {
      console.warn("⚠️ No leaderboard data received from API");
    }
  } catch (error) {
    console.error("❌ Leaderboard refresh failed:", error);
    // Silent fail for refresh operations to avoid disrupting UX
  }
}

/**
 * Updates user authentication state in the store
 *
 * @param member - Member data to set in auth state
 */
export async function refreshUserData(member: Member): Promise<void> {
  try {
    console.log("🔄 Refreshing user data...");
    const state = useMainStore.getState();

    // Update auth state with user data
    state.setAuthState(member, true);
    console.log("✅ User data refreshed");
  } catch (error) {
    console.error("❌ User data refresh failed:", error);
    throw error;
  }
}

/**
 * Refreshes tournament data and handles tournament state transitions
 *
 * Special handling for tournaments transitioning from current to past:
 * - Captures final leaderboard data before transition
 * - Enhances past tournament data with captured leaderboard
 */
export async function refreshTournamentData(): Promise<void> {
  try {
    console.log("🔄 Refreshing tournament data...");

    // Get current state before updating to detect transitions
    const currentState = useMainStore.getState();
    const previousCurrentTournament = currentState.currentTournament;

    // Load fresh tournament data
    const tournamentData = await loadTournamentData();

    // Determine new current/next tournaments
    const { currentTournament, nextTournament } = updateTournamentState(
      tournamentData.seasonTournaments,
    );

    // Handle tournament transition from current to past
    if (
      previousCurrentTournament &&
      (!currentTournament ||
        previousCurrentTournament.id !== currentTournament.id)
    ) {
      console.log(
        `🔄 Tournament "${previousCurrentTournament.name}" transitioning to past status`,
      );

      // Capture final leaderboard data for historical record
      const capturedData = await captureLeaderboardForPastTournament(
        previousCurrentTournament.id,
      );

      // Enhance past tournaments with captured leaderboard data
      if (capturedData && tournamentData.pastTournaments) {
        const enhancedPastTournaments = tournamentData.pastTournaments.map(
          (pastTournament) => {
            if (pastTournament.id === previousCurrentTournament.id) {
              console.log(
                `✅ Enhanced past tournament "${pastTournament.name}" with leaderboard data`,
              );
              return {
                ...pastTournament,
                teams: capturedData.teams,
                golfers: capturedData.golfers,
              };
            }
            return pastTournament;
          },
        );

        tournamentData.pastTournaments = enhancedPastTournaments;
      }
    }

    // Update store with refreshed tournament data
    useMainStore.setState((state) => ({
      ...state,
      ...tournamentData,
      currentTournament,
      nextTournament,
      _lastUpdated: Date.now(),
    }));

    console.log("✅ Tournament data refreshed");
  } catch (error) {
    console.error("❌ Tournament data refresh failed:", error);
    throw error;
  }
}

// =====================================================
// Leaderboard Preservation
// =====================================================

/**
 * Captures and preserves leaderboard data when tournament transitions to past
 *
 * Strategy:
 * 1. First try to use data from leaderboard store (most current)
 * 2. Fallback to fresh API fetch if store is empty
 * 3. Return null if no data available (graceful degradation)
 *
 * @param tournamentId - ID of tournament transitioning to past
 * @returns Captured leaderboard data or null
 */
async function captureLeaderboardForPastTournament(
  tournamentId: string,
): Promise<LeaderboardData | null> {
  try {
    console.log(
      `📦 Capturing leaderboard data for tournament ${tournamentId}...`,
    );

    // Strategy 1: Use current leaderboard store data (most up-to-date)
    const leaderboardState = useLeaderboardStore.getState();
    const { teams, golfers } = leaderboardState;

    if (teams && golfers && teams.length > 0 && golfers.length > 0) {
      console.log(
        `✅ Captured leaderboard data from store: ${teams.length} teams, ${golfers.length} golfers`,
      );
      return { teams, golfers };
    }

    // Strategy 2: Fallback to fresh API fetch
    console.log("⚠️ No data in store, attempting fresh API fetch...");
    const data = await loadLeaderboardData();

    if (data && data.teams.length > 0 && data.golfers.length > 0) {
      console.log(
        `✅ Captured leaderboard data from API: ${data.teams.length} teams, ${data.golfers.length} golfers`,
      );
      return data;
    }

    console.warn("❌ No leaderboard data available to capture");
    return null;
  } catch (error) {
    console.error("❌ Failed to capture leaderboard data:", error);
    return null;
  }
}
