"use server";

import { db } from "../db";
import { ScheduleTournament } from "./schedule";
import type { Tour } from "@prisma/client";

export type ChampionData = {
  id: number;
  displayName: string;
  score: number;
  tournament: {
    id: string;
    name: string;
    logoUrl: string | null;
    startDate: Date;
  };
  tour: { id: string; name: string; logoUrl: string | null };
  golfers: {
    id: number;
    position: string;
    playerName: string;
    score: number;
  }[];
};

/**
 * Returns the champion data of the most recent completed tournament
 * if it ended within the last 3 days, formatted for ChampionsPopup component.
 *
 * @param recentTournament - The recent tournament to get champions for
 * @param tours - Array of tours for the season to match tour cards against
 * @returns Array of champion data formatted for ChampionsPopup component
 */
export async function getRecentChampions(
  recentTournament: ScheduleTournament,
  tours: Tour[],
): Promise<ChampionData[]> {
  const now = new Date();

  // Only return if ended within last 3 days
  const diff =
    (now.getTime() - recentTournament.endDate.getTime()) /
    (1000 * 60 * 60 * 24);
  if (diff < 0 || diff > 3) return [];

  // Get all champion teams (position "1" or "T1") for this tournament
  const teams = await db.team.findMany({
    where: {
      tournamentId: recentTournament.id,
      OR: [{ position: "1" }, { position: "T1" }],
    },
    include: {
      tourCard: true,
      tournament: true,
    },
  });

  if (!teams.length) return [];

  // Get all golfers for all golferIds in champion teams
  const allGolferApiIds = Array.from(
    new Set(teams.flatMap((t) => t.golferIds)),
  );
  const golfers = allGolferApiIds.length
    ? await db.golfer.findMany({
        where: {
          apiId: { in: allGolferApiIds },
          tournamentId: recentTournament.id,
        },
      })
    : [];

  // Build the champion data in the format expected by ChampionsPopup
  const champions: ChampionData[] = teams.map((team) => {
    const tour = tours.find((t) => t.id === team.tourCard.tourId);
    const teamGolfers = team.golferIds
      .map((golferId) => golfers.find((g) => g.apiId === golferId))
      .filter(Boolean)
      .map((golfer) => ({
        id: golfer!.id,
        position: golfer!.position || "CUT",
        playerName: golfer!.playerName,
        score: golfer!.score || 0,
      }));

    return {
      id: team.id,
      displayName: team.tourCard.displayName,
      score: team.score || 0,
      tournament: {
        id: recentTournament.id,
        name: recentTournament.name,
        logoUrl: recentTournament.logoUrl,
        startDate: recentTournament.startDate,
      },
      tour: {
        id: tour?.id || "",
        name: tour?.name || "",
        logoUrl: tour?.logoUrl || null,
      },
      golfers: teamGolfers,
    };
  });

  return champions;
}
