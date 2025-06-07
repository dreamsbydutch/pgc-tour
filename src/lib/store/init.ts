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
import { cacheManager } from "./cache";
import { initializeLeaderboard } from "./leaderboard";

type ProcessedTournament = Tournament & {
  course: Course | null;
  golfers: Golfer[];
  teams: (Team & { tourCard: TourCard | null })[];
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

async function safeFetch<T>(url: string, timeout = 10000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`❌ ${url}: ${response.status}`);
      return null;
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`💥 ${url} failed:`, error);
    return null;
  }
}

async function fetchMemberData(): Promise<{ member: Member } | null> {
  const store = useMainStore.getState();
  
  // Use existing auth state if available
  if (store.isAuthenticated && store.currentMember) {
    console.log("👤 Using cached member data");
    return { member: store.currentMember };
  }
  
  if (store.isAuthenticated === false) {
    console.log("👤 Not authenticated, skipping member fetch");
    return null;
  }
  
  console.log("👤 Fetching member data...");
  return safeFetch<{ member: Member }>("/api/members/current");
}

export async function loadInitialData() {
  console.log("🔄 Starting store initialization...");
  
  // Quick API health check
  const healthCheck = await safeFetch("/api/seasons/current", 5000);
  if (!healthCheck) {
    throw new Error("API endpoints not responding");
  }
  
  // Check cache first
  const cacheResult = await cacheManager.checkAndRefresh({ source: "init" });
  if (cacheResult.success) {
    console.log("✅ Cache refreshed:", cacheResult.reason);
  }
  
  const store = useMainStore.getState();
  
  // Check if we have complete cached data
  const hasCompleteData = !!(
    store.tours?.length &&
    store.seasonTournaments?.length &&
    store.tourCards?.length &&
    store.currentSeason &&
    store.currentTiers?.length
  );
  
  const isFresh = store._lastUpdated && (Date.now() - store._lastUpdated) < CACHE_EXPIRY;
  
  if (hasCompleteData && isFresh) {
    console.log("✅ Using complete cached data");
    return store;
  }
  
  console.log("📡 Fetching missing data...");
  
  // Fetch all required data in parallel
  const [
    toursData,
    tournamentsData,
    seasonData,
    tiersData,
    memberData,
    pastTeamsData,
    pastGolfersData,
    tourCardsData,
  ] = await Promise.all([
    safeFetch<{ tours: Tour[] }>("/api/tours/all"),
    safeFetch<{ tournaments: (Tournament & { course: Course | null })[] }>("/api/tournaments/all"),
    safeFetch<{ season: Season }>("/api/seasons/current"),
    safeFetch<{ tiers: Tier[] }>("/api/tiers/current"),
    fetchMemberData(),
    safeFetch<{ pastTeams: (Team & { tourCard: TourCard | null })[] }>("/api/teams/past"),
    safeFetch<{ pastGolfers: Golfer[] }>("/api/golfers/past"),
    safeFetch<{ tourCards: TourCard[] }>("/api/tourcards/current"),
  ]);
  
  // Process tournaments
  let pastTournaments: ProcessedTournament[] | null = null;
  let currentTournament = null;
  let nextTournament = null;
  
  if (tournamentsData?.tournaments) {
    const now = new Date();
    const tournaments = tournamentsData.tournaments.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    currentTournament = tournaments.find(
      t => new Date(t.startDate) <= now && 
           new Date(t.endDate) >= now && 
           (t.currentRound ?? 0) < 5
    ) ?? null;
    
    nextTournament = tournaments.find(t => new Date(t.startDate) > now) ?? null;
    
    // Process past tournaments with related data
    const pastTournamentsArray = tournaments.filter(
      t => new Date(t.endDate) < now || (t.currentRound ?? 0) >= 5
    );
    
    const validPastTeams = pastTeamsData?.pastTeams ?? [];
    const validPastGolfers = pastGolfersData?.pastGolfers ?? [];
    
    pastTournaments = pastTournamentsArray.map(t => ({
      ...t,
      golfers: validPastGolfers.filter(g => g.tournamentId === t.id),
      teams: validPastTeams.filter(team => team.tournamentId === t.id),
    }));
  }
  
  // Process user-specific data
  const currentTourCard = memberData?.member
    ? tourCardsData?.tourCards?.find(tc => tc.memberId === memberData.member.id) ?? null
    : null;
    
  const currentTour = currentTourCard
    ? toursData?.tours?.find(t => t.id === currentTourCard.tourId) ?? null
    : null;
  
  // Update store with all data
  const updateData = {
    tours: toursData?.tours ?? store.tours ?? [],
    seasonTournaments: tournamentsData?.tournaments?.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    ) ?? store.seasonTournaments ?? [],
    pastTournaments: pastTournaments ?? store.pastTournaments ?? [],
    currentTournament: currentTournament ?? store.currentTournament,
    nextTournament: nextTournament ?? store.nextTournament,
    currentSeason: seasonData?.season ?? store.currentSeason,
    currentTiers: tiersData?.tiers?.sort(
      (a, b) => (a.payouts[0] ?? 0) - (b.payouts[0] ?? 0)
    ) ?? store.currentTiers ?? [],
    tourCards: tourCardsData?.tourCards ?? store.tourCards ?? [],
    currentMember: memberData?.member ?? store.currentMember ?? null,
    currentTour: currentTour ?? store.currentTour,
    currentTourCard: currentTourCard ?? store.currentTourCard,
    _lastUpdated: Date.now(),
  };
  
  useMainStore.setState(updateData);
  
  // Update auth state
  const finalMember = updateData.currentMember;
  useMainStore.getState().setAuthState(finalMember, !!finalMember);
  
  console.log("✅ Store initialization complete");
  
  // Initialize leaderboard if needed
  if (updateData.currentTournament) {
    await initializeLeaderboard(updateData.currentTournament.id).catch(console.error);
  }
  
  return updateData;
}
