"use server";

import { db } from "@pgc-server";
import type { Tournament, Tour, Team, Golfer, TourCard } from "@prisma/client";

export type LeaderboardTeam = Team & { golfers: Golfer[]; tourCard: TourCard };
export type LeaderboardTour = Tour & { teams: LeaderboardTeam[] };
export type LeaderboardData = {
  currentTournament: Tournament | null;
  tours: LeaderboardTour[];
};

/**
 * Returns the current tournament, all tours for the current season, and for each tour,
 * all teams in this tournament with their golfers attached (by golferIds/apiId).
 */
export async function getLeaderboardData(): Promise<LeaderboardData> {
  // Get the current tournament
  const now = new Date();
  const currentTournament = await db.tournament.findFirst({
    where: {
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
  });
  if (!currentTournament) return { currentTournament: null, tours: [] };

  // Get all tours for the current season
  const seasonId = currentTournament.seasonId;
  const tours = await db.tour.findMany({ where: { seasonId } });

  // Get all teams for this tournament
  const teams = await db.team.findMany({
    where: { tournamentId: currentTournament.id },
    include: { tourCard: true },
  });

  const golfers = await db.golfer.findMany({
    where: { tournamentId: currentTournament.id },
  });

  // Attach teams (with golfers) to each tour
  const leaderboardTours: LeaderboardTour[] = tours.map((tour) => {
    const tourTeams = teams
      .filter((team) => team.tourCard.tourId === tour.id)
      .map((team) => {
        const teamGolfers = golfers.filter((golfer) =>
          team.golferIds?.includes(golfer.apiId),
        );
        return {
          ...team,
          golfers: teamGolfers,
          mainStat: team.score, // Assuming points is the main stat
          secondaryStat: team.thru, // Assuming earnings is the secondary stat
        };
      });
    return { ...tour, teams: tourTeams };
  });

  return {
    currentTournament,
    tours: leaderboardTours,
  };
}
