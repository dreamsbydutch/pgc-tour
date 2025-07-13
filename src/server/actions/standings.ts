"use server";

import { db } from "../db";
import { getCurrentSeason } from "./season";
import type {
  Team,
  TourCard,
  Member,
  Tournament,
  Tour,
  Tier,
} from "@prisma/client";
import { getMemberFromHeaders } from "@pgc-auth";
import { getCurrentTourCard } from "./tourCard";

export type CurrentStandingsResult = {
  teams: Team[];
  tours: Tour[];
  tiers: Tier[];
  tourCards: TourCard[];
  currentTourCard: TourCard | null;
  currentMember: Member | null;
  tournaments: Tournament[];
  seasonId: string | null;
};

/**
 * Gets the current standings: all teams, tourCards, tournaments for the current season,
 * and the current signed-in member and their tourCard.
 */
export async function getCurrentStandings(): Promise<CurrentStandingsResult> {
  const season = await getCurrentSeason();
  const seasonId = season ? season.id : null;
  const currentMember = await getMemberFromHeaders();
  const currentTourCard = await getCurrentTourCard();

  // Fetch all tournaments for the current season
  const tournaments = seasonId
    ? await db.tournament.findMany({ where: { seasonId } })
    : [];

  const tours = seasonId
    ? await db.tour.findMany({
        where: { seasonId },
        orderBy: { name: "asc" },
      })
    : [];

  const tiers = seasonId
    ? await db.tier.findMany({
        where: { seasonId },
        orderBy: { points: "asc" },
      })
    : [];

  // Get all teams for all tournaments in the current season
  const tournamentIds = tournaments.map((t) => t.id);
  const teams = tournamentIds.length
    ? await db.team.findMany({ where: { tournamentId: { in: tournamentIds } } })
    : [];

  // Fetch all tourCards for the current season
  const tourCards = seasonId
    ? await db.tourCard.findMany({ where: { seasonId } })
    : [];

  return {
    teams,
    tours,
    tiers,
    tourCards,
    currentTourCard,
    currentMember,
    tournaments,
    seasonId,
  };
}
