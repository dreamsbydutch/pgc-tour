/**
 * Store Initialization
 *
 * Single source of truth for loading and initializing all store data.
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

// Type definitions
type TournamentData = Tournament & {
  course: Course | null;
};

type ProcessedTournament = TournamentData & {
  golfers: Golfer[];
  teams: (Team & { tourCard: TourCard | null })[];
};

type LeaderboardTeam = Team & { tourCard: TourCard | null };

// Fetch utilities with proper error handling
async function safeFetch<T>(url: string, timeout = 10000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch (_error) {
    return null;
  }
}

// Load core application data
async function loadCoreData() {
  const [tourCardsResponse, toursResponse, seasonsResponse, tiersResponse] =
    await Promise.all([
      safeFetch<{ tourCards: TourCard[] }>("/api/tourcards/current"),
      safeFetch<{ tours: Tour[] }>("/api/tours/all"),
      safeFetch<{ seasons: Season[] }>("/api/seasons/current"),
      safeFetch<{ tiers: Tier[] }>("/api/tiers/current"),
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
  const [tournamentResponse, pastTournamentsResponse] = await Promise.all([
    safeFetch<{ tournaments: TournamentData[] }>("/api/tournaments/all"),
    safeFetch<{ tournaments: ProcessedTournament[] }>("/api/tournaments/past"),
  ]);

  return {
    seasonTournaments: tournamentResponse?.tournaments ?? [],
    pastTournaments: pastTournamentsResponse?.tournaments ?? [],
  };
}

// Load leaderboard data
async function loadLeaderboardData(): Promise<{
  teams: LeaderboardTeam[];
  golfers: Golfer[];
} | null> {
  try {
    // Add timestamp to bust cache
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
      return null;
    }

    return (await response.json()) as {
      teams: LeaderboardTeam[];
      golfers: Golfer[];
    };
  } catch (_error) {
    return null;
  }
}

// Determine current tournament state
function updateTournamentState(tournaments: TournamentData[]) {
  if (!tournaments.length) {
    return { currentTournament: null, nextTournament: null };
  }

  const now = new Date();
  const sortedTournaments = [...tournaments].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  // Find current tournament (started but not ended, and not completed)
  const currentTournament =
    sortedTournaments.find(
      (t) =>
        new Date(t.startDate) <= now &&
        new Date(t.endDate) >= now &&
        (t.currentRound ?? 0) < 5,
    ) ?? null;

  // Find next tournament (not yet started)
  const nextTournament =
    sortedTournaments.find((t) => new Date(t.startDate) > now) ?? null;

  return { currentTournament, nextTournament };
}

// Main initialization function
export async function initializeStore(): Promise<void> {
  try {
    // Load core data and tournaments in parallel
    const [coreData, tournamentData] = await Promise.all([
      loadCoreData(),
      loadTournamentData(),
    ]);

    // Determine current/next tournaments
    const { currentTournament, nextTournament } = updateTournamentState(
      tournamentData.seasonTournaments,
    );

    // Get current season (most recent)
    const currentSeason =
      coreData.seasons.length > 0
        ? coreData.seasons.sort((a, b) => b.year - a.year)[0]
        : null;

    // Initialize the main store with all data
    const initData = {
      ...coreData,
      ...tournamentData,
      currentTournament,
      nextTournament,
      currentSeason,
      currentTiers: coreData.tiers,
    };
    useMainStore.getState().initializeData(initData);
    // Initialize leaderboard if there's a current tournament
    if (currentTournament) {
      await initializeLeaderboard().catch(() => {
        // Ignore leaderboard initialization errors during main store init
      });
    }
  } catch (error) {
    throw error;
  }
}

// Initialize leaderboard for a tournament
export async function initializeLeaderboard(): Promise<void> {
  try {
    const data = await loadLeaderboardData();

    if (data) {
      useLeaderboardStore.getState().update(data.teams, data.golfers);
    } else {
      throw new Error("Failed to fetch leaderboard data");
    }
  } catch (error) {
    throw error;
  }
}

// Refresh functions for different data sections
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
    // Silent fail for refresh operations
  }
}

export async function refreshUserData(member: Member): Promise<void> {
  try {
    const state = useMainStore.getState();

    // Find user's tour card and tour
    // const userTourCard = state.tourCards?.find(tc => tc.memberId === member.id) ?? null;

    // Update auth state with user data
    state.setAuthState(member, true);
  } catch (error) {
    throw error;
  }
}

export async function refreshTournamentData(): Promise<void> {
  try {
    const tournamentData = await loadTournamentData();

    // Determine current/next tournaments
    const { currentTournament, nextTournament } = updateTournamentState(
      tournamentData.seasonTournaments,
    );

    // Update store with new tournament data
    useMainStore.setState((state) => ({
      ...state,
      ...tournamentData,
      currentTournament,
      nextTournament,
      _lastUpdated: Date.now(),
    }));
  } catch (error) {
    throw error;
  }
}

// Check if leaderboard should be actively polling
export function shouldPollLeaderboard(tournament: {
  startDate: string | Date;
  endDate: string | Date;
  currentRound?: number | null;
}): boolean {
  if (!tournament) return false;

  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  return (
    startDate <= now && endDate >= now && (tournament.currentRound ?? 0) < 5
  );
}
