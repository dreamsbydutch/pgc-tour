/**
 * Champions Server Actions
 * Server-side equivalent of useChampions hook
 *
 * Provides recent champions data for server-side rendering
 * and server components. Returns the same data structure as the client hook.
 */

import { api } from "@/trpc/server";

/**
 * Get recent champions data
 * Server equivalent of useRecentChampions()
 */
export async function getRecentChampions(daysLimit: number = 7) {
  try {
    // Get all tournaments and find completed ones
    const tournaments = await api.tournament.getAll();
    const now = new Date();
    const completedTournaments = tournaments.filter(
      (t: any) => t.endDate < now,
    );

    if (completedTournaments.length === 0) {
      return {
        tournament: null,
        champs: [],
        error: "No recent tournaments",
        isLoading: false,
      };
    }

    // Get most recent tournament
    const recentTournament = completedTournaments.sort(
      (a: any, b: any) => b.endDate.getTime() - a.endDate.getTime(),
    )[0];

    if (!recentTournament) {
      return {
        tournament: null,
        champs: [],
        error: "No recent tournaments",
        isLoading: false,
      };
    }

    // Check if tournament is within time limit
    const daysSinceEnd = Math.floor(
      (now.getTime() - recentTournament.endDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysSinceEnd > daysLimit) {
      return {
        tournament: recentTournament,
        champs: [],
        error: "Tournament too old",
        isLoading: false,
      };
    }

    // Get champion teams
    const allTeams = await api.team.getByTournament({
      tournamentId: recentTournament.id,
    });

    const championTeams = allTeams.filter((team: any) => team.position === "1");

    // Get additional data for enrichment
    const [allTours, allTourCards] = await Promise.all([
      api.tour.getAll(),
      api.tourCard.getAll(),
    ]);

    // Enrich champions with tour information
    const enrichedChampions = championTeams.map((team: any) => {
      const tourCard = allTourCards.find(
        (tc: any) => tc.id === team.tourCardId,
      );
      const tour = tourCard
        ? allTours.find((t: any) => t.id === tourCard.tourId)
        : null;

      return {
        ...team,
        tour: tour || { id: "unknown", name: "Unknown" },
        tourCard: tourCard || null,
      };
    });

    return {
      tournament: recentTournament,
      champs: enrichedChampions,
      error: null,
      isLoading: false,
    };
  } catch (error) {
    console.error("Error fetching recent champions:", error);
    return {
      tournament: null,
      champs: [],
      error: error instanceof Error ? error.message : "Unknown error",
      isLoading: false,
    };
  }
}

/**
 * Get champions for a specific tournament
 * Convenience function for server components
 */
export async function getChampionsByTournament(tournamentId: string) {
  try {
    // Get specific tournament
    const tournaments = await api.tournament.getAll();
    const tournament = tournaments.find((t: any) => t.id === tournamentId);

    if (!tournament) {
      return {
        tournament: null,
        champs: [],
        error: "Tournament not found",
        isLoading: false,
      };
    }

    // Get champion teams
    const allTeams = await api.team.getByTournament({ tournamentId });
    const championTeams = allTeams.filter((team: any) => team.position === "1");

    // Get additional data for enrichment
    const [allTours, allTourCards] = await Promise.all([
      api.tour.getAll(),
      api.tourCard.getAll(),
    ]);

    // Enrich champions
    const enrichedChampions = championTeams.map((team: any) => {
      const tourCard = allTourCards.find(
        (tc: any) => tc.id === team.tourCardId,
      );
      const tour = tourCard
        ? allTours.find((t: any) => t.id === tourCard.tourId)
        : null;

      return {
        ...team,
        tour: tour || { id: "unknown", name: "Unknown" },
        tourCard: tourCard || null,
      };
    });

    return {
      tournament,
      champs: enrichedChampions,
      error: null,
      isLoading: false,
    };
  } catch (error) {
    console.error("Error fetching champions by tournament:", error);
    return {
      tournament: null,
      champs: [],
      error: error instanceof Error ? error.message : "Unknown error",
      isLoading: false,
    };
  }
}

/**
 * Get latest champions with full team details including golfers
 * Specifically for ChampionsPopup component
 */
export async function getLatestChampions() {
  try {
    // Get all tournaments and find the most recent completed one
    const tournaments = await api.tournament.getAll();
    const now = new Date();
    const completedTournaments = tournaments.filter(
      (t: any) => t.endDate < now,
    );

    if (completedTournaments.length === 0) {
      return {
        tournament: null,
        champs: [],
      };
    }

    // Sort by end date to get the most recent
    const recentTournament = completedTournaments.sort(
      (a: any, b: any) => b.endDate.getTime() - a.endDate.getTime(),
    )[0];

    if (!recentTournament) {
      return {
        tournament: null,
        champs: [],
      };
    }

    // Get all teams for this tournament
    const allTeams = await api.team.getByTournament({
      tournamentId: recentTournament.id,
    });

    // Filter to only champions (position 1)
    const championTeams = allTeams.filter((team: any) => team.position === "1");

    // Get all golfers for this tournament
    const allGolfers = await api.golfer.getByTournament({
      tournamentId: recentTournament.id,
    });

    // Get all tour cards to get tour information
    const allTourCards = await api.tourCard.getAll();
    const allTours = await api.tour.getAll();

    // Enrich champion teams with tour and golfer data
    const enrichedChamps = await Promise.all(
      championTeams.map(async (team: any) => {
        // Find the tour card and tour
        const tourCard = allTourCards.find(
          (tc: any) => tc.id === team.tourCardId,
        );
        const tour = allTours.find((t: any) => t.id === tourCard?.tourId);

        // Get golfers for this team using the golferIds array
        let teamGolfers: any[] = [];
        if (team.golferIds && team.golferIds.length > 0) {
          teamGolfers = allGolfers.filter((golfer: any) =>
            team.golferIds.includes(golfer.id),
          );
        }

        return {
          ...team,
          tour: tour || { id: "", name: "Unknown", logoUrl: "" },
          tourCard: tourCard || { displayName: "Unknown" },
          golfers: teamGolfers,
        };
      }),
    );

    return {
      tournament: recentTournament,
      champs: enrichedChamps,
    };
  } catch (error) {
    console.error("Error fetching latest champions:", error);
    return {
      tournament: null,
      champs: [],
    };
  }
}
