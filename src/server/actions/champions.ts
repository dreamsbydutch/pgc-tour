"use server";

import { db } from "../db";
import type { Team, Tournament, TourCard, Golfer, Tour } from "@prisma/client";

export type RecentChampionTourCard = TourCard & {
  team: Team;
  golfers: Golfer[];
  tour: Tour;
};

export type RecentChampionsResult = {
  tournament: Tournament | null;
  champions: RecentChampionTourCard[];
};

/**
 * Returns the champion tourCards (with team, tour, and golfers) of the most recent completed tournament
 * if it ended within the last 3 days.
 */
export async function getRecentChampions(): Promise<RecentChampionsResult> {
  const now = new Date();
  // Find the most recent completed tournament (ended before now)
  const recentTournament = await db.tournament.findFirst({
    where: { endDate: { lt: now } },
    orderBy: { endDate: "desc" },
  });
  if (!recentTournament) return { tournament: null, champions: [] };

  // Only return if ended within last 3 days
  const end = new Date(recentTournament.endDate);
  const diff = (now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0 || diff > 3) return { tournament: null, champions: [] };

  // Get all champion teams (position "1" or "T1") for this tournament
  const teams = await db.team.findMany({
    where: {
      tournamentId: recentTournament.id,
      OR: [{ position: "1" }, { position: "T1" }],
    },
  });

  // Get all tourCards for these teams
  const tourCardIds = teams.map((t) => t.tourCardId).filter(Boolean);
  const tourCards = tourCardIds.length
    ? await db.tourCard.findMany({ where: { id: { in: tourCardIds } } })
    : [];

  // Get all golfers for all golferIds in champion teams (number[])
  const allGolferApiIds = Array.from(
    new Set(teams.flatMap((t) => t.golferIds)),
  );
  const golfers = allGolferApiIds.length
    ? await db.golfer.findMany({ where: { apiId: { in: allGolferApiIds } } })
    : [];

  // Try to get the tourId from the tournament (adjust field name if needed)
  const tours = await db.tour.findMany({
    where: { seasonId: recentTournament.seasonId },
  });

  // Attach team, tour, and golfers to each champion tourCard
  const champions: RecentChampionTourCard[] = tourCards.map((tc) => {
    const team = teams.find((t) => t.tourCardId === tc.id)!;
    const tour = tours.find((t) => t.id === tc.tourId)!;
    const teamGolfers = (team.golferIds)
      .map((id) => golfers.find((g) => g.apiId === id))
      .filter(Boolean) as Golfer[];
    return {
      ...tc,
      team,
      golfers: teamGolfers,
      tour,
    };
  });

  return {
    tournament: recentTournament,
    champions,
  };
}
