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
    return await response.json();
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

  // Fetch all required data
  const [
    toursData,
    memberData,
    pastTeamsData,
    pastGolfersData,
    tournamentsData,
    seasonData,
    tourCardsData,
    tiersData,
  ] = await Promise.all([
    safeFetch<{ tours: Tour[] }>("/api/tours/all"),
    safeFetch<{ member: Member }>("/api/members/current"),
    safeFetch<{ pastTeams: (Team & { tourCard: TourCard | null })[] }>(
      "/api/teams/past",
    ),
    safeFetch<{ pastGolfers: Golfer[] }>("/api/golfers/past"),
    safeFetch<{
      tournaments: (Tournament & {
        course: Course | null;
      })[];
    }>("/api/tournaments/all"),
    safeFetch<{ currentSeason: Season }>("/api/seasons/current"),
    safeFetch<{ tourCards: TourCard[] }>("/api/tourcards/current"),
    safeFetch<{ tiers: Tier[] }>("/api/tiers/current"),
  ]);

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

    console.log(
      `Processing past tournaments with ${validPastTeams.length} teams and ${validPastGolfers.length} golfers`,
    );

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

  const currentTourCard =
    tourCardsData?.tourCards?.find(
      (tc) => tc.memberId === memberData?.member.id,
    ) ?? null;
  const currentTour =
    toursData?.tours?.find((t) => t.id === currentTourCard?.tourId) ?? null;

  // Update store with new data, keeping existing data as fallback
  const updateData = {
    tours: toursData?.tours ?? storeData.tours,
    currentMember: memberData?.member ?? storeData.currentMember,
    pastTeamsData: pastTeamsData?.pastTeams ?? storeData.pastTeams,
    seasonTournaments:
      tournamentsData?.tournaments.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      ) ?? storeData.seasonTournaments,
    pastTournaments: pastTournaments ?? storeData.pastTournaments,
    currentTournament: currentTournament ?? storeData.currentTournament,
    nextTournament: nextTournament ?? storeData.nextTournament,
    tourCards: tourCardsData?.tourCards ?? storeData.tourCards,
    currentSeason: seasonData?.currentSeason ?? storeData.currentSeason,
    currentTiers:
      tiersData?.tiers.sort(
        (a, b) => (a.payouts[0] ?? 0) - (b.payouts[0] ?? 0),
      ) ?? storeData.currentTiers,
    // Maintain other values from existing state
    currentTour: currentTour ?? storeData.currentTour,
    currentTourCard: currentTourCard ?? storeData.currentTourCard,
    _lastUpdated: Date.now(),
  };

  useMainStore.setState(updateData);
  return updateData;
}
