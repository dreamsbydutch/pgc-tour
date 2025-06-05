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
import { checkAndRefreshIfNeeded, refreshWithMiddlewareCoordination } from "./cacheInvalidation";
import { initializeLeaderboardStore } from "./leaderboardInit";

type ProcessedTournament = Tournament & {
  course: Course | null;
  golfers: Golfer[];
  teams: (Team & { tourCard: TourCard | null })[];
};

// Cache expiry in milliseconds (1 day)
const CACHE_EXPIRY = 1000 * 60 * 60 * 24;

// Retry member data fetch with exponential backoff (for auth race conditions)
async function fetchMemberWithRetry(
  maxRetries = 5,
  baseDelay = 1000,
): Promise<{ member: Member } | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const memberData = await safeFetch<{ member: Member }>("/api/members/current");
      
      if (memberData?.member) {
        console.log(`👤 Member API response (attempt ${attempt}): ✅ logged in as ${memberData.member.email}`);
        return memberData;
      } else {
        console.log(`👤 Member API response (attempt ${attempt}): 👻 not logged in`);
        // If this is the last attempt, return null
        if (attempt === maxRetries) {
          return null;
        }
        
        // Wait before retrying (exponential backoff with jitter)
        const delay = baseDelay * Math.pow(1.5, attempt - 1) + Math.random() * 500;
        console.log(`⏳ Retrying member fetch in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`❌ Member API error (attempt ${attempt}):`, error);
      if (attempt === maxRetries) {
        return null;
      }
      
      // Wait before retrying
      const delay = baseDelay * Math.pow(1.5, attempt - 1) + Math.random() * 500;
      console.log(`⏳ Retrying member fetch after error in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

// Enhanced member fetch that checks store authentication state
async function fetchMemberWithAuthCheck(): Promise<{ member: Member } | null> {
  const store = useMainStore.getState();
  
  // If we already have auth state from AuthContext, use it
  if (store.isAuthenticated && store.currentMember) {
    console.log("👤 Using authenticated member from store:", store.currentMember.email);
    return { member: store.currentMember };
  }
  
  // If explicitly not authenticated, don't try API call
  if (store.isAuthenticated === false) {
    console.log("👤 Store indicates not authenticated, skipping API call");
    return null;
  }
  
  // Otherwise, fetch from API with retry logic
  console.log("👤 Fetching member data from API...");
  return fetchMemberWithRetry(3, 800); // Reduced retries since AuthContext handles auth state
}

// Simplified fetch helper with timeout
async function safeFetch<T>(
  url: string,
  timeoutMs = 10000,
): Promise<T | null> {
  try {
    console.log(`🚀 Fetching: ${url}`);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });

    // Race between fetch and timeout
    const response: Response = await Promise.race([fetch(url), timeoutPromise]);

    if (!response.ok) {
      console.error(
        `❌ ${url} returned ${response.status}: ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as T;
    console.log(`✅ ${url} completed successfully`);
    return data;
  } catch (error) {
    console.error(`💥 Failed to fetch ${url}:`, error);
    return null;
  }
}

// Add a simple health check for API endpoints
async function testAPIHealth() {
  console.log("🩺 Testing API health...");

  try {
    const response = await fetch("/api/seasons/current", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      console.log("✅ Basic API connectivity confirmed");
      return true;
    } else {
      console.error(
        "❌ API health check failed:",
        response.status,
        response.statusText,
      );
      return false;
    }
  } catch (error) {
    console.error("💥 API health check error:", error);
    return false;
  }
}

export async function loadInitialData() {
  console.log("🔄 loadInitialData: Starting with enhanced coordination...");

  // Quick API health check
  const apiHealthy = await testAPIHealth();
  if (!apiHealthy) {
    throw new Error(
      "API endpoints are not responding. Please check your server connection.",
    );
  }
  
  // First check database-driven cache invalidation with middleware coordination
  console.log("🔍 Checking cache invalidation with middleware coordination...");
  
  // Check middleware coordination first if available
  let middlewareCoordinated = false;
  if (typeof window !== 'undefined') {
    try {
      const middlewareResult = await refreshWithMiddlewareCoordination();
      middlewareCoordinated = middlewareResult.refreshed;
      if (middlewareCoordinated) {
        console.log("🔄 Middleware-coordinated cache refresh:", middlewareResult.reason);
      }
    } catch (error) {
      console.warn("Middleware coordination failed (non-critical):", error);
    }
  }
  
  // Then check database-driven cache invalidation
  const cacheCheck = await checkAndRefreshIfNeeded({
    respectMiddleware: true,
    source: 'main-init',
  });
  
  if (cacheCheck.refreshed || middlewareCoordinated) {
    console.log(
      "🔄 Cache refreshed:",
      middlewareCoordinated ? "middleware coordination" : "database flags",
      cacheCheck.reason,
    );
    // Don't return early - continue to fetch all missing data
    console.log(
      "🔄 Cache partially refreshed, continuing to fetch all data...",
    );
  }
  // Check if we should use cached data - only if ALL required data is present
  const storeData = useMainStore.getState();
  console.log("📦 Current store data:", {
    hasTours: !!storeData.tours?.length,
    hasTournaments: !!storeData.seasonTournaments?.length,
    hasTourCards: !!storeData.tourCards?.length,
    hasCurrentSeason: !!storeData.currentSeason,
    hasTiers: !!storeData.currentTiers?.length,
    lastUpdated: storeData._lastUpdated,
  });

  // Check if current tournament has reached round 5 (completion)
  const currentTournamentCompleted =
    storeData.currentTournament &&
    (storeData.currentTournament.currentRound ?? 0) >= 5;

  if (currentTournamentCompleted) {
    console.log("Cache invalidated: Current tournament completed (round 5)");
  }

  // Quick check: if currentTournament appears in pastTournaments, clear it immediately
  if (
    storeData.currentTournament &&
    storeData.pastTournaments &&
    storeData.pastTournaments.length > 0
  ) {
    const currentTournamentInPast = storeData.pastTournaments.some(
      (pastTournament) => pastTournament.id === storeData.currentTournament?.id,
    );

    if (currentTournamentInPast) {
      console.log(
        "🔄 Quick fix: currentTournament found in pastTournaments, clearing it",
      );
      useMainStore.setState({ currentTournament: null });
    }
  }

  // Only use cached data if ALL essential data is present and fresh
  const hasCompleteData = !!(
    storeData.tours?.length &&
    storeData.seasonTournaments?.length &&
    storeData.tourCards?.length &&
    storeData.currentSeason &&
    storeData.currentTiers?.length
  );

  if (
    hasCompleteData &&
    storeData._lastUpdated &&
    Date.now() - storeData._lastUpdated < CACHE_EXPIRY &&
    !currentTournamentCompleted
  ) {
    console.log("✅ Using cached data (complete and fresh)");
    return storeData;
  } else if (!hasCompleteData) {
    console.log("🔄 Incomplete cached data, fetching missing data...");
  }

  let publicDataLoaded = false;
  let userDataLoaded = false;

  try {
    console.log("📡 Fetching public data...");
    // Fetch public data (always needed) - this should succeed even for logged-out users
    const [toursData, tournamentsData, seasonData, tiersData] =
      await Promise.all([
        safeFetch<{ tours: Tour[] }>("/api/tours/all").then((data) => {
          console.log(
            "🏆 Tours API response:",
            data ? "✅ success" : "❌ failed",
          );
          return data;
        }),
        safeFetch<{
          tournaments: (Tournament & {
            course: Course | null;
          })[];
        }>("/api/tournaments/all").then((data) => {
          console.log(
            "🏌️ Tournaments API response:",
            data ? "✅ success" : "❌ failed",
          );
          return data;
        }),
        safeFetch<{ season: Season }>("/api/seasons/current").then((data) => {
          console.log(
            "📅 Season API response:",
            data ? "✅ success" : "❌ failed",
          );
          return data;
        }),
        safeFetch<{ tiers: Tier[] }>("/api/tiers/current").then((data) => {
          console.log(
            "🎯 Tiers API response:",
            data ? "✅ success" : "❌ failed",
          );
          return data;
        }),
      ]);

    publicDataLoaded = !!(
      toursData ??
      tournamentsData ??
      seasonData ??
      tiersData
    );

    console.log("📡 Fetching user data...");
    // Fetch user-specific data using enhanced auth-aware method
    
    const [memberData, pastTeamsData, pastGolfersData, tourCardsData] =
      await Promise.all([
        // Use enhanced member fetch that checks auth state first
        fetchMemberWithAuthCheck(),
        safeFetch<{ pastTeams: (Team & { tourCard: TourCard | null })[] }>(
          "/api/teams/past",
        ).then((data) => {
          console.log(
            "🏌️‍♂️ Past teams API response:",
            data ? "✅ success" : "❌ failed",
          );
          return data;
        }),
        safeFetch<{ pastGolfers: Golfer[] }>("/api/golfers/past").then(
          (data) => {
            console.log(
              "⛳ Past golfers API response:",
              data ? "✅ success" : "❌ failed",
            );
            return data;
          },
        ),
        safeFetch<{ tourCards: TourCard[] }>("/api/tourcards/current").then(
          (data) => {
            console.log(
              "🎫 Tour cards API response:",
              data ? "✅ success" : "❌ failed",
            );
            return data;
          },
        ),
      ]);

    userDataLoaded = !!memberData?.member;

    console.log(
      `📊 Store initialization: Public data ${publicDataLoaded ? "✅ loaded" : "❌ failed"}, User data ${userDataLoaded ? "✅ loaded" : "👻 not available"}`,
    ); // Process tournaments to get past, current, and next
    const now = new Date();
    let pastTournaments: ProcessedTournament[] | null = null;
    let currentTournament = null;
    let nextTournament = null;
    if (tournamentsData?.tournaments) {
      const tournaments = tournamentsData.tournaments.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
      // Find current tournament (ongoing)
      // A tournament is current if it's within the date range AND hasn't reached round 5 (completion)
      currentTournament =
        tournaments.find(
          (t) =>
            new Date(t.startDate) <= now &&
            new Date(t.endDate) >= now &&
            (t.currentRound ?? 0) < 5,
        ) ?? null;

      // Find next tournament (upcoming)
      nextTournament =
        tournaments.find((t) => new Date(t.startDate) > now) ?? null; // Verify pastTeamsData and pastGolfersData before using them
      const validPastTeams = Array.isArray(pastTeamsData?.pastTeams)
        ? pastTeamsData.pastTeams
        : [];
      const validPastGolfers = Array.isArray(pastGolfersData?.pastGolfers)
        ? pastGolfersData.pastGolfers
        : []; // Find most recent past tournament with safer approach
      try {
        // A tournament is past if either:
        // 1. Its end date has passed, OR
        // 2. It has reached round 5 (completion) regardless of date
        const pastTournamentsArray = tournaments.filter(
          (t) => new Date(t.endDate) < now || (t.currentRound ?? 0) >= 5,
        );
        pastTournamentsArray.sort(
          (a, b) =>
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
        );

        pastTournaments = pastTournamentsArray.map((t) => {
          // Safely filter related data
          const tournamentGolfers = validPastGolfers.filter(
            (g) => g.tournamentId === t.id,
          );
          const tournamentTeams = validPastTeams.filter(
            (team) => team.tournamentId === t.id,
          );

          return {
            ...t,
            golfers: tournamentGolfers,
            teams: tournamentTeams,
          };
        });
      } catch (error) {
        console.error("Error processing past tournaments:", error);
        pastTournaments = [];
      }
    } // Check for cache inconsistency: if currentTournament matches the first pastTournament
    // This indicates the cache has stale data where a completed tournament is still marked as current
    if (
      storeData.currentTournament &&
      pastTournaments &&
      pastTournaments.length > 0
    ) {
      const cachedCurrentTournament = storeData.currentTournament;
      const mostRecentPastTournament = pastTournaments[0]; // First item is most recent due to sorting

      if (cachedCurrentTournament.id === mostRecentPastTournament?.id) {
        console.log(
          "🔄 Detected stale currentTournament - clearing it (tournament has ended)",
        );
        console.log(
          `Tournament "${cachedCurrentTournament.name}" should now be in past tournaments`,
        );

        // Just clear the currentTournament, don't do a full reset
        useMainStore.setState({ currentTournament: null });

        // Update the local variable so the rest of the function uses the correct value
        currentTournament = null;
      }
    }

    // Only process user-specific data if member exists (logged in)
    const currentTourCard = memberData?.member
      ? (tourCardsData?.tourCards?.find(
          (tc) => tc.memberId === memberData.member.id,
        ) ?? null)
      : null;
    const currentTour = currentTourCard
      ? (toursData?.tours?.find((t) => t.id === currentTourCard.tourId) ?? null)
      : null;

    // Update store with new data, keeping existing data as fallback
    const updateData = {
      // Public data (always available)
      tours: toursData?.tours ?? storeData.tours ?? [],
      seasonTournaments:
        tournamentsData?.tournaments?.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        ) ??
        storeData.seasonTournaments ??
        [],
      pastTournaments: pastTournaments ?? storeData.pastTournaments ?? [],
      currentTournament: currentTournament ?? storeData.currentTournament,
      nextTournament: nextTournament ?? storeData.nextTournament,
      currentSeason: seasonData?.season ?? storeData.currentSeason,
      currentTiers:
        tiersData?.tiers?.sort(
          (a, b) => (a.payouts[0] ?? 0) - (b.payouts[0] ?? 0),
        ) ??
        storeData.currentTiers ??
        [],
      // Tour cards are public data (needed for standings/leaderboards)
      tourCards: tourCardsData?.tourCards ?? storeData.tourCards ?? [],

      // User-specific data (preserve existing if fetch fails, null only if explicitly logged out)
      currentMember: memberData?.member ?? storeData.currentMember ?? null,
      currentTour: currentTour ?? storeData.currentTour,
      currentTourCard: currentTourCard ?? storeData.currentTourCard,

      _lastUpdated: Date.now(),
    };
    
    // Update store with main data first
    useMainStore.setState(updateData);
    
    // Then update auth state properly to ensure consistency
    const finalMember = updateData.currentMember;
    useMainStore.getState().setAuthState(finalMember, !!finalMember);

    console.log("✅ Store updated successfully:", {
      tours: updateData.tours.length,
      tournaments: updateData.seasonTournaments.length,
      tourCards: updateData.tourCards.length,
      currentMember: !!updateData.currentMember,
    });

    // Initialize leaderboard store if there's a current tournament
    if (updateData.currentTournament) {
      console.log("🏆 Current tournament detected, initializing leaderboard store...");
      try {
        const leaderboardInitialized = await initializeLeaderboardStore();
        if (leaderboardInitialized) {
          console.log("✅ Leaderboard store initialized successfully");
        } else {
          console.log("⚠️ Leaderboard store initialization returned false");
        }
      } catch (error) {
        console.error("❌ Failed to initialize leaderboard store:", error);
      }
    } else {
      console.log("📅 No current tournament found, skipping leaderboard initialization");
    }

    return updateData;
  } catch (error) {
    console.error("Critical error during store initialization:", error);

    // Even if there's an error, try to maintain some basic state
    const fallbackData = {
      tours: storeData.tours ?? [],
      seasonTournaments: storeData.seasonTournaments ?? [],
      pastTournaments: storeData.pastTournaments ?? [],
      currentTournament: storeData.currentTournament,
      nextTournament: storeData.nextTournament,
      currentSeason: storeData.currentSeason,
      currentTiers: storeData.currentTiers ?? [],
      tourCards: storeData.tourCards ?? [], // Keep existing tour cards if available
      _lastUpdated: Date.now(),
    };

    useMainStore.setState(fallbackData);
    // Clear auth state on error to ensure clean state
    useMainStore.getState().clearAuthState();
    throw error; // Re-throw so the error handling in useInitStore can catch it
  }
}
