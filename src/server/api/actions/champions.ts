/**
 * Champions Server Actions
 * Server-side equivalent of useChampions hook
 *
 * Provides recent champions data for server-side rendering
 * and server components. Returns the same data structure as the client hook.
 */

import { api } from "@/trpc/server";
import type { Tournament, Tour, TourCard, Golfer } from "@prisma/client";

// --- Types for ChampionsPopup ---
type ChampionData = Omit<
  TourCard,
  | "createdAt"
  | "updatedAt"
  | "earnings"
  | "points"
  | "win"
  | "topTen"
  | "madeCut"
  | "appearances"
  | "seasonId"
  | "tourId"
  | "memberId"
  | "id"
> & {
  id: number;
  name: string;
  totalScore: number;
  tour: Pick<Tour, "id" | "name" | "logoUrl">;
  tourCard: Pick<TourCard, "id" | "displayName"> | null;
  golfers: Array<Pick<Golfer, "id" | "playerName" | "score" | "position">>;
};

type TournamentData = Pick<
  Tournament,
  "id" | "name" | "startDate" | "endDate" | "logoUrl"
>;

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
      (tournament) => tournament.endDate < now,
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
      (a, b) => b.endDate.getTime() - a.endDate.getTime(),
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

    const championTeams = allTeams.filter(
      (team) => team.position === "1" || team.position === "T1",
    );

    // Get additional data for enrichment
    const [allTours, allTourCards] = await Promise.all([
      api.tour.getAll(),
      api.tourCard.getAll(),
    ]);

    // Enrich champions with tour information
    const enrichedChampions = championTeams.map((team) => {
      const tourCard = allTourCards.find((tc) => tc.id === team.tourCardId);
      const tour = tourCard
        ? allTours.find((t) => t.id === tourCard.tourId)
        : null;

      return {
        id: team.id,
        name: team.tourCard?.displayName || "Unknown Team",
        position: team.position,
        totalScore: team.score || 0,
        tour: tour
          ? {
              id: tour.id,
              name: tour.name,
            }
          : {
              id: "unknown",
              name: "Unknown",
            },
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
    const tournament = tournaments.find((t) => t.id === tournamentId);

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
    const championTeams = allTeams.filter(
      (team) => team.position === "1" || team.position === "T1",
    );

    // Get additional data for enrichment
    const [allTours, allTourCards] = await Promise.all([
      api.tour.getAll(),
      api.tourCard.getAll(),
    ]);

    // Enrich champions
    const enrichedChampions = championTeams.map((team) => {
      const tourCard = allTourCards.find((tc) => tc.id === team.tourCardId);
      const tour = tourCard
        ? allTours.find((t) => t.id === tourCard.tourId)
        : null;

      return {
        id: team.id,
        name: team.tourCard?.displayName || "Unknown Team",
        position: team.position,
        totalScore: team.score || 0,
        tour: tour
          ? {
              id: tour.id,
              name: tour.name,
            }
          : {
              id: "unknown",
              name: "Unknown",
            },
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
      (tournament) => tournament.endDate < now,
    );

    if (completedTournaments.length === 0) {
      return {
        tournament: null,
        champs: [],
      };
    }

    // Sort by end date to get the most recent
    const recentTournament = completedTournaments.sort(
      (a, b) => b.endDate.getTime() - a.endDate.getTime(),
    )[0];

    if (!recentTournament) {
      return {
        tournament: null,
        champs: [],
      };
    }

    // Only show if the tournament ended within the last 3 days
    const daysSinceEnd =
      (now.getTime() - recentTournament.endDate.getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceEnd > 3) {
      return {
        tournament: null,
        champs: [],
      };
    }

    // Get all teams for this tournament
    const allTeams = await api.team.getByTournament({
      tournamentId: recentTournament.id,
    });

    // Filter to only champions (position "1" or "T1")
    const championTeams = allTeams.filter(
      (team) => team.position === "1" || team.position === "T1",
    );

    // Get all golfers for this tournament
    const allGolfers = await api.golfer.getByTournament({
      tournamentId: recentTournament.id,
    });

    // Get all tour cards to get tour information
    const allTourCards = await api.tourCard.getAll();
    const allTours = await api.tour.getAll();

    // Enrich champion teams with tour and golfer data
    const enrichedChamps: ChampionData[] = await Promise.all(
      championTeams.map(async (team) => {
        const tourCard = allTourCards.find((tc) => tc.id === team.tourCardId);
        const tour = allTours.find((t) => t.id === tourCard?.tourId);
        const golfers =
          team.golferIds && team.golferIds.length > 0
            ? allGolfers
                .filter((golfer) => team.golferIds.includes(golfer.apiId))
                .map((golfer) => ({
                  id: golfer.id,
                  playerName: golfer.playerName,
                  score: golfer.score || 0,
                  position: golfer.position || "N/A",
                }))
            : [];
        // Construct the result object explicitly to match ChampionData type
        return {
          id: team.id,
          name: team.tourCard?.displayName || "Unknown Team",
          totalScore: team.score || 0,
          position: team.position || "",
          displayName: team.tourCard?.displayName || "Unknown Team",
          playoff: 0,
          tour: tour
            ? {
                id: tour.id,
                name: tour.name,
                logoUrl: tour.logoUrl || "",
              }
            : {
                id: "",
                name: "Unknown",
                logoUrl: "",
              },
          tourCard: tourCard
            ? {
                id: tourCard.id,
                displayName: tourCard.displayName,
              }
            : null,
          golfers,
        };
      }),
    );

    return {
      tournament: {
        id: recentTournament.id,
        name: recentTournament.name,
        startDate: recentTournament.startDate,
        endDate: recentTournament.endDate,
        logoUrl: recentTournament.logoUrl,
      },
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
