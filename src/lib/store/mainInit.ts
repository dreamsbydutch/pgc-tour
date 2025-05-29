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

// Cache expiry in milliseconds (1 day)
const CACHE_EXPIRY = 1000 * 60 * 60 * 24;

// Simplified fetch helper
async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const response: Response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

export async function loadInitialData() {
  // Check if we should use cached data
  const storeData = useMainStore.getState();
  if (
    storeData._lastUpdated &&
    Date.now() - storeData._lastUpdated < CACHE_EXPIRY
  ) {
    return storeData;
  }

  let publicDataLoaded = false;
  let userDataLoaded = false;

  try {
    // Fetch public data (always needed) - this should succeed even for logged-out users
    const [
      toursData,
      tournamentsData,
      seasonData,
      tiersData,
    ] = await Promise.all([
      safeFetch<{ tours: Tour[] }>("/api/tours/all"),
      safeFetch<{
        tournaments: (Tournament & {
          course: Course | null;
        })[];
      }>("/api/tournaments/all"),
      safeFetch<{ season: Season }>("/api/seasons/current"),
      safeFetch<{ tiers: Tier[] }>("/api/tiers/current"),
    ]);

    publicDataLoaded = !!(toursData || tournamentsData || seasonData || tiersData);

    // Fetch user-specific data (gracefully handle failures for logged-out users)
    const [
      memberData,
      pastTeamsData,
      pastGolfersData,
      tourCardsData,
    ] = await Promise.all([
      safeFetch<{ member: Member }>("/api/members/current"),
      safeFetch<{ pastTeams: (Team & { tourCard: TourCard | null })[] }>(
        "/api/teams/past",
      ),
      safeFetch<{ pastGolfers: Golfer[] }>("/api/golfers/past"),
      safeFetch<{ tourCards: TourCard[] }>("/api/tourcards/current"),
    ]);

    userDataLoaded = !!(memberData?.member);

    console.log(`Store initialization: Public data ${publicDataLoaded ? 'loaded' : 'failed'}, User data ${userDataLoaded ? 'loaded' : 'not available'}`);

    // Process tournaments to get past, current, and next
    const now = new Date();
    let pastTournaments = null;
    let currentTournament = null;
    let nextTournament = null;

    if (tournamentsData?.tournaments) {
      const tournaments = tournamentsData.tournaments.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );

      // Find current tournament (ongoing)
      currentTournament =
        tournaments.find(
          (t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now,
        ) ?? null;

      // Find next tournament (upcoming)
      nextTournament =
        tournaments.find((t) => new Date(t.startDate) > now) ?? null;

      // Verify pastTeamsData and pastGolfersData before using them
      const validPastTeams = Array.isArray(pastTeamsData?.pastTeams)
        ? pastTeamsData.pastTeams
        : [];
      const validPastGolfers = Array.isArray(pastGolfersData?.pastGolfers)
        ? pastGolfersData.pastGolfers
        : [];

      // Find most recent past tournament with safer approach
      try {
        const pastTournamentsArray = tournaments.filter(
          (t) => new Date(t.endDate) < now,
        );
        pastTournamentsArray.sort(
          (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
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
    }

    // Only process user-specific data if member exists (logged in)
    const currentTourCard = memberData?.member 
      ? tourCardsData?.tourCards?.find(
          (tc) => tc.memberId === memberData.member.id,
        ) ?? null
      : null;
    const currentTour = currentTourCard
      ? toursData?.tours?.find((t) => t.id === currentTourCard.tourId) ?? null
      : null;

    // Update store with new data, keeping existing data as fallback
    const updateData = {
      // Public data (always available)
      tours: toursData?.tours ?? storeData.tours ?? [],
      seasonTournaments:
        tournamentsData?.tournaments?.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        ) ?? storeData.seasonTournaments ?? [],
      pastTournaments: pastTournaments ?? storeData.pastTournaments ?? [],
      currentTournament: currentTournament ?? storeData.currentTournament,
      nextTournament: nextTournament ?? storeData.nextTournament,
      currentSeason: seasonData?.season ?? storeData.currentSeason,
      currentTiers:
        tiersData?.tiers?.sort(
          (a, b) => (a.payouts[0] ?? 0) - (b.payouts[0] ?? 0),
        ) ?? storeData.currentTiers ?? [],
      // Tour cards are public data (needed for standings/leaderboards)
      tourCards: tourCardsData?.tourCards ?? storeData.tourCards ?? [],
      
      // User-specific data (null if not logged in)
      currentMember: memberData?.member ?? null,
      currentTour: currentTour ?? storeData.currentTour,
      currentTourCard: currentTourCard ?? storeData.currentTourCard,
      
      _lastUpdated: Date.now(),
    };

    useMainStore.setState(updateData);
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
      currentMember: null, // Always null on error
      currentTour: storeData.currentTour,
      currentTourCard: storeData.currentTourCard,
      _lastUpdated: Date.now(),
    };

    useMainStore.setState(fallbackData);
    throw error; // Re-throw so the error handling in useInitStore can catch it
  }
}
}
